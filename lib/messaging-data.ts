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
 * Relies on conversations.booking_id being UNIQUE — if a conversation
 * already exists for this booking, returns it; otherwise creates one
 * and seeds both participants in a single pass.
 */
export async function getOrCreateBookingConversation(
  bookingId: string,
  participantIds: [string, string],
): Promise<string> {
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data: newConvo, error: createError } = await supabase
    .from("conversations")
    .insert({ type: "booking", booking_id: bookingId })
    .select("id")
    .single();

  if (createError) {
    // Unique violation on booking_id means another request created it
    // first (race between two inserts) — fetch and return that one
    // instead of failing the caller.
    if ((createError as any).code === "23505") {
      const { data: raceWinner, error: raceError } = await supabase
        .from("conversations")
        .select("id")
        .eq("booking_id", bookingId)
        .single();
      if (raceError) throw raceError;
      return raceWinner.id;
    }
    throw createError;
  }

  const { error: participantsError } = await supabase
    .from("conversation_participants")
    .insert(
      participantIds.map((userId) => ({
        conversation_id: newConvo.id,
        user_id: userId,
      })),
    );

  if (participantsError) throw participantsError;

  return newConvo.id;
}

// ═══════════════════════════════════════════════════════════════════
// Conversation list
// ═══════════════════════════════════════════════════════════════════

/**
 * Returns the current user's conversations, newest activity first,
 * each with the other participant's profile, a preview of the last
 * message, and an unread count.
 *
 * Built as several plain queries + Map merges rather than one
 * embedded-join select — this project has repeatedly hit PGRST200
 * ("could not find relationship") on embedded joins where FK
 * introspection doesn't resolve cleanly, so that style is avoided
 * everywhere in this codebase, not just here.
 */
export async function listConversations(): Promise<ConversationListItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Step 1: every conversation_participants row for the current user,
  // including their own last_read_at for unread-count math below.
  const { data: myParticipantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);

  if (participantError) throw participantError;
  if (!myParticipantRows || myParticipantRows.length === 0) return [];

  const conversationIds = myParticipantRows.map((r) => r.conversation_id);
  const lastReadByConvo = new Map(
    myParticipantRows.map((r) => [r.conversation_id, r.last_read_at]),
  );

  // Step 2: the conversation rows themselves, sorted by activity.
  const { data: conversations, error: convoError } = await supabase
    .from("conversations")
    .select("id, type, booking_id, last_message_at")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false });

  if (convoError) throw convoError;
  if (!conversations || conversations.length === 0) return [];

  // Step 3: the OTHER participant in each conversation (not me).
  const { data: allParticipants, error: allParticipantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds);

  if (allParticipantsError) throw allParticipantsError;

  const otherUserIdByConvo = new Map<string, string>();
  (allParticipants || []).forEach((p) => {
    if (p.user_id !== user.id) {
      otherUserIdByConvo.set(p.conversation_id, p.user_id);
    }
  });

  const otherUserIds = [...new Set(otherUserIdByConvo.values())];

  // Step 4: profiles for those other participants, in one batch.
  const { data: profiles, error: profilesError } =
    otherUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", otherUserIds)
      : { data: [], error: null };

  if (profilesError) throw profilesError;

  const profileByUserId = new Map((profiles || []).map((p) => [p.user_id, p]));

  // Step 5: last message per conversation. Fetched as "all messages
  // in these conversations, ordered, then take the first per
  // conversation_id client-side" rather than N separate
  // "last message for conversation X" queries.
  const { data: recentMessages, error: messagesError } = await supabase
    .from("messages")
    .select("conversation_id, content, attachments, created_at, sender_id")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;

  const lastMessageByConvo = new Map<
    string,
    {
      content: string | null;
      attachments: string[];
      created_at: string;
      sender_id: string;
    }
  >();
  (recentMessages || []).forEach((m) => {
    if (!lastMessageByConvo.has(m.conversation_id)) {
      lastMessageByConvo.set(m.conversation_id, m);
    }
  });

  // Step 6: unread counts. A message counts as unread if it was sent
  // after this user's last_read_at for that conversation (or if
  // last_read_at is null, meaning they've never read it at all) AND
  // it wasn't sent by the user themselves.
  const unreadCountByConvo = new Map<string, number>();
  (recentMessages || []).forEach((m) => {
    if (m.sender_id === user.id) return;
    const lastRead = lastReadByConvo.get(m.conversation_id);
    const isUnread = !lastRead || new Date(m.created_at) > new Date(lastRead);
    if (isUnread) {
      unreadCountByConvo.set(
        m.conversation_id,
        (unreadCountByConvo.get(m.conversation_id) || 0) + 1,
      );
    }
  });

  return conversations.map((c) => ({
    id: c.id,
    type: c.type,
    booking_id: c.booking_id,
    last_message_at: c.last_message_at,
    otherParticipant:
      profileByUserId.get(otherUserIdByConvo.get(c.id) || "") || null,
    lastMessage: lastMessageByConvo.get(c.id) || null,
    unreadCount: unreadCountByConvo.get(c.id) || 0,
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

  return visibleMessages.map((m) => ({
    ...m,
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

  return {
    ...inserted,
    attachments: attachmentUrls,
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

  // Bucket is private, so a signed URL is required for display rather
  // than a public URL. 7 days chosen as a reasonable window — long
  // enough that a cached/rendered chat thread keeps working without
  // needing to re-sign on every load, but not indefinite.
  const { data: signed, error: signError } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (signError) throw signError;

  return signed.signedUrl;
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
