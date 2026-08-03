import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface ConversationParticipantProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface ConversationListItem {
  id: string;
  type: "direct" | "booking";
  booking_id: string | null;
  last_message_at: string;
  otherParticipant: ConversationParticipantProfile | null;
  lastMessage: {
    content: string | null;
    attachments: string[];
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
}

export interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  attachments: string[];
  created_at: string;
  sender: ConversationParticipantProfile | null;
}

const ATTACHMENT_BUCKET = "message-attachments";

// ═══════════════════════════════════════════════════════════════════
// Conversation creation
// ═══════════════════════════════════════════════════════════════════

/**
 * Finds an existing direct (non-booking) conversation between the
 * current user and `otherUserId`, or creates one if none exists.
 *
 * Delegates to the get_or_create_direct_conversation Postgres function
 * rather than doing this as separate client-side queries — the whole
 * find-or-create runs inside one transaction there, serialized by an
 * advisory lock keyed on the pair of user ids, so two simultaneous
 * calls for the same pair can't both pass the "does it exist" check
 * and create duplicate threads. See messaging-rpc.sql for the
 * function definition.
 */
export async function getOrCreateDirectConversation(
  otherUserId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "get_or_create_direct_conversation",
    { other_user_id: otherUserId },
  );

  if (error) throw error;
  return data as string;
}

/**
 * Finds or creates the single conversation tied to a specific booking.
 * Delegates to the get_or_create_booking_conversation Postgres function,
 * which verifies the caller is actually a party to the booking and seeds
 * both participants atomically as its SECURITY DEFINER owner — client-side
 * inserts into conversation_participants are restricted to "insert myself
 * only" by RLS, so this can't be done as plain table writes. See
 * 20260803120000_security_hardening.sql for the function definition.
 */
export async function getOrCreateBookingConversation(
  bookingId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "get_or_create_booking_conversation",
    { p_booking_id: bookingId },
  );

  if (error) throw error;
  return data as string;
}

// ═══════════════════════════════════════════════════════════════════
// Conversation list
// ═══════════════════════════════════════════════════════════════════

/**
 * Returns the current user's conversations, newest activity first,
 * each with the other participant's profile, a preview of the last
 * message, and an unread count.
 *
 * A single round trip to the get_conversation_previews() RPC, which
 * computes the last message and unread count per conversation with
 * per-row LATERAL joins server-side (see
 * 20260803120100_conversation_previews_rpc.sql) — the previous
 * implementation fetched every message across every one of the user's
 * conversations on every render just to derive these two things.
 */
export async function listConversations(): Promise<ConversationListItem[]> {
  const { data, error } = await supabase.rpc("get_conversation_previews");
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const rows = data as Array<{
    id: string;
    type: "direct" | "booking";
    booking_id: string | null;
    last_message_at: string;
    other_user_id: string | null;
    other_full_name: string | null;
    other_avatar_url: string | null;
    last_message_content: string | null;
    last_message_attachments: string[] | null;
    last_message_created_at: string | null;
    last_message_sender_id: string | null;
    unread_count: number;
  }>;

  const signedByPath = await signAttachments(
    rows.map((r) => ({ attachments: r.last_message_attachments || [] })),
  );

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    booking_id: r.booking_id,
    last_message_at: r.last_message_at,
    otherParticipant: r.other_user_id
      ? {
          user_id: r.other_user_id,
          full_name: r.other_full_name || "Unknown",
          avatar_url: r.other_avatar_url,
        }
      : null,
    lastMessage: r.last_message_created_at
      ? {
          content: r.last_message_content,
          attachments: (r.last_message_attachments || []).map(
            (p) => signedByPath.get(p) || p,
          ),
          created_at: r.last_message_created_at,
          sender_id: r.last_message_sender_id as string,
        }
      : null,
    unreadCount: Number(r.unread_count) || 0,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Messages within a conversation
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetches messages for a conversation, oldest first, excluding any
 * the current user has soft-deleted for themselves.
 */
export async function getMessages(
  conversationId: string,
  limit = 50,
): Promise<MessageWithSender[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, attachments, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (messagesError) throw messagesError;
  if (!messages || messages.length === 0) return [];

  // Filter out messages this user has deleted for themselves.
  const { data: myDeletions, error: deletionsError } = await supabase
    .from("message_deletions")
    .select("message_id")
    .eq("user_id", user.id)
    .in(
      "message_id",
      messages.map((m) => m.id),
    );

  if (deletionsError) throw deletionsError;

  const deletedIds = new Set((myDeletions || []).map((d) => d.message_id));
  const visibleMessages = messages.filter((m) => !deletedIds.has(m.id));

  // Attach sender profiles.
  const senderIds = [...new Set(visibleMessages.map((m) => m.sender_id))];
  const { data: senders, error: sendersError } =
    senderIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", senderIds)
      : { data: [], error: null };

  if (sendersError) throw sendersError;

  const senderByUserId = new Map((senders || []).map((s) => [s.user_id, s]));
  const signedByPath = await signAttachments(visibleMessages);

  return visibleMessages.map((m) => ({
    ...m,
    attachments: m.attachments.map((p) => signedByPath.get(p) || p),
    sender: senderByUserId.get(m.sender_id) || null,
  }));
}

/**
 * Sends a message, uploading any attached files first. Files are
 * uploaded under {conversationId}/{messageId}-{filename} — this path
 * convention is load-bearing: the storage RLS policies parse the
 * first path segment as the conversation_id to authorize access, so
 * any change to this convention must be mirrored in the storage SQL.
 *
 * The message row is inserted BEFORE the upload so a real message id
 * exists to build the path from, then updated with the resulting
 * attachment URLs. If the upload fails partway through, the message
 * still exists with whatever attachments succeeded — callers should
 * surface upload errors to the user rather than silently swallowing
 * them, but a failed image attach does not lose the message text.
 */
export async function sendMessage(
  conversationId: string,
  content: string | null,
  files?: File[],
): Promise<MessageWithSender> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (
    (!content || content.trim().length === 0) &&
    (!files || files.length === 0)
  ) {
    throw new Error("Message must have text or an attachment");
  }

  const { data: inserted, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content?.trim() || null,
      attachments: [],
    })
    .select("id, conversation_id, sender_id, content, attachments, created_at")
    .single();

  if (insertError) throw insertError;

  let attachmentUrls: string[] = [];

  if (files && files.length > 0) {
    attachmentUrls = await Promise.all(
      files.map((file) => uploadAttachment(conversationId, inserted.id, file)),
    );

    const { error: updateError } = await supabase
      .from("messages")
      .update({ attachments: attachmentUrls })
      .eq("id", inserted.id);

    if (updateError) throw updateError;
  }

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("user_id, full_name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const signedByPath = await signAttachments([{ attachments: attachmentUrls }]);

  return {
    ...inserted,
    attachments: attachmentUrls.map((p) => signedByPath.get(p) || p),
    sender: senderProfile || null,
  };
}

async function uploadAttachment(
  conversationId: string,
  messageId: string,
  file: File,
): Promise<string> {
  const path = `${conversationId}/${messageId}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  // Store the storage PATH, not a signed URL — signed URLs expire (see
  // signAttachments below, which re-signs on every read) so a persisted
  // URL would silently break playback/downloads once it lapses.
  return path;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, re-signed on every read

async function signAttachments(
  messages: { attachments: string[] }[],
): Promise<Map<string, string>> {
  const allPaths = [...new Set(messages.flatMap((m) => m.attachments))];
  if (allPaths.length === 0) return new Map();

  const signedByPath = new Map<string, string>();
  await Promise.all(
    allPaths.map(async (path) => {
      // Already-signed absolute URLs from legacy rows — pass through as-is.
      if (/^https?:\/\//i.test(path)) {
        signedByPath.set(path, path);
        return;
      }
      const { data, error } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (!error && data) {
        signedByPath.set(path, data.signedUrl);
      }
    }),
  );
  return signedByPath;
}

// ═══════════════════════════════════════════════════════════════════
// Read state + deletion
// ═══════════════════════════════════════════════════════════════════

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function deleteMessageForMe(messageId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("message_deletions")
    .insert({ message_id: messageId, user_id: user.id });

  if (error) throw error;
}

// Search profiles the current user can start a direct 1:1 chat with.
export async function searchMessageableUsers(
  query: string,
  limit = 12,
): Promise<ConversationParticipantProfile[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let q = supabase
    .from("profiles")
    .select("user_id, full_name, avatar_url")
    .neq("user_id", user.id)
    .order("full_name", { ascending: true })
    .limit(limit);

  const trimmed = query.trim();
  if (trimmed) {
    // Escape PostgREST/LIKE special characters so user input can't alter
    // the filter structure (comma breaks the .or() list; %/_ are LIKE
    // wildcards that would let "%" match everyone).
    const escaped = trimmed.replace(/[,%_\\]/g, "\\$&");
    q = q.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((p) => ({
    user_id: p.user_id,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
  }));
}
