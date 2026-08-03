"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import {
  listConversations,
  getMessages,
  sendMessage as sendMessageApi,
  markConversationRead,
  getOrCreateDirectConversation,
  type ConversationListItem,
  type MessageWithSender,
  type ConversationParticipantProfile,
} from "@/lib/messaging-data";
import { getPartySummaries } from "@/lib/data/profiles";
import { NewChatDialog } from "@/components/chat/NewChatDialog";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  MessageSquare,
  Plus,
  Search,
  ArrowLeft,
  Paperclip,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { describeSupabaseError } from "@/lib/utils/errors";
import { Spinner } from "@/components/shared/spinner";

interface ActivePartner {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

function formatDayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function MessageBubble({
  msg,
  isMine,
}: {
  msg: MessageWithSender;
  isMine: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-[78%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 shadow-sm relative",
        isMine
          ? "bg-primary text-primary-foreground rounded-tr-sm ml-auto"
          : "bg-card text-card-foreground rounded-tl-sm border border-border/60",
      )}
    >
      {msg.content ? (
        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">
          {msg.content}
        </p>
      ) : msg.attachments?.length > 0 ? (
        <a
          href={msg.attachments[0]}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 text-sm underline underline-offset-2",
            isMine ? "text-primary-foreground/90" : "text-primary",
          )}
        >
          <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
          Attachment
        </a>
      ) : null}

      <p
        className={cn(
          "text-[10px] text-right mt-0.5 select-none",
          isMine ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {format(new Date(msg.created_at), "HH:mm")}
      </p>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<ActivePartner | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convos = await listConversations();
      setConversations(convos);
    } catch (err) {
      // Supabase/Postgrest errors are Error subclasses whose `message`
      // is a non-enumerable inherited property — logging the raw object
      // (or JSON.stringifying it, as some error reporters do) shows
      // "{}" and hides the actual cause. Pull the useful fields out
      // explicitly instead.
      const details = describeSupabaseError(err);
      console.error("Failed to load conversations:", details);
      toast.error(
        details.code === "PGRST202"
          ? "Messaging isn't fully set up yet. Please contact support."
          : "Failed to load conversations",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  const openConversation = useCallback(
    async (convId: string, partner: ActivePartner | null) => {
      setActiveConvId(convId);
      setActivePartner(partner);
      setConversationLoading(true);
      setMessages([]);
      try {
        const msgs = await getMessages(convId);
        setMessages(msgs);
        await markConversationRead(convId);
        fetchConversations();
      } catch (err) {
        console.error("Failed to open conversation:", describeSupabaseError(err));
        toast.error("Failed to open conversation");
      } finally {
        setConversationLoading(false);
      }
    },
    [fetchConversations],
  );

  const startChatWithUser = useCallback(
    async (partner: ConversationParticipantProfile) => {
      if (!user) return;
      try {
        const convId = await getOrCreateDirectConversation(partner.user_id);
        await openConversation(convId, {
          user_id: partner.user_id,
          full_name: partner.full_name,
          avatar_url: partner.avatar_url,
        });
      } catch (err) {
        console.error("Failed to start conversation:", describeSupabaseError(err));
        toast.error("Could not start conversation");
      }
    },
    [user, openConversation],
  );

  const initWithUser = useCallback(
    async (targetId: string) => {
      if (!user) return;
      try {
        const convId = await getOrCreateDirectConversation(targetId);
        const summaries = await getPartySummaries([targetId]);
        const summary = summaries.get(targetId);
        const partner: ActivePartner = summary
          ? {
              user_id: summary.user_id,
              full_name: summary.full_name,
              avatar_url: summary.avatar_url,
            }
          : { user_id: targetId, full_name: "User", avatar_url: null };
        await openConversation(convId, partner);
      } catch (err) {
        console.error("Failed to start conversation:", describeSupabaseError(err));
        toast.error("Could not open conversation");
      }
    },
    [user, openConversation],
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (withUserId) initWithUser(withUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withUserId]);

  useEffect(() => {
    if (!user || !activeConvId) return;

    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        async (payload) => {
          const incoming = payload.new as MessageWithSender;
          if (incoming.sender_id === user.id) return;

          let sender: ActivePartner | null = null;
          try {
            const summaries = await getPartySummaries([incoming.sender_id]);
            const profile = summaries.get(incoming.sender_id);
            if (profile) {
              sender = {
                user_id: profile.user_id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
              };
            }
          } catch {
            /* non-fatal */
          }

          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id)
              ? prev
              : [...prev, { ...incoming, sender }],
          );

          await markConversationRead(activeConvId);
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConvId, fetchConversations]);

  // Only auto-scroll to the newest message when the reader was already at
  // (or near) the bottom — otherwise jumping the viewport while someone is
  // reading older history feels jarring and loses their place.
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
  };

  const handleSend = async () => {
    if (!user || !activeConvId || !messageText.trim()) return;
    setSending(true);
    isNearBottomRef.current = true;
    try {
      const sent = await sendMessageApi(activeConvId, messageText.trim());
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
      setMessageText("");
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message:", describeSupabaseError(err));
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.otherParticipant?.full_name?.toLowerCase().includes(q),
    );
  }, [conversations, listSearch]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: MessageWithSender[] }[] = [];
    messages.forEach((msg) => {
      const d = new Date(msg.created_at);
      const label = formatDayLabel(d);
      const last = groups[groups.length - 1];
      if (last && last.date === label) {
        last.messages.push(msg);
      } else {
        groups.push({ date: label, messages: [msg] });
      }
    });
    return groups;
  }, [messages]);

  const closeChat = () => {
    setActiveConvId(null);
    setActivePartner(null);
    setMessages([]);
  };

  return (
    <>
      <div className="h-full flex overflow-hidden rounded-xl border border-border shadow-sm bg-card">
        {/* Sidebar — conversation list */}
        <div
          className={cn(
            "w-full md:w-[340px] lg:w-[380px] flex flex-col border-r border-border bg-card",
            activeConvId ? "hidden md:flex" : "flex",
          )}
        >
          <div className="px-4 py-3.5 flex items-center justify-between gap-2 border-b border-border">
            <h2 className="font-heading font-bold text-foreground text-lg">
              Chats
            </h2>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Start new chat"
              className="h-9 w-9 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
              onClick={() => setNewChatOpen(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="px-3 py-2.5 bg-card border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <label htmlFor="chat-search" className="sr-only">
                Search conversations
              </label>
              <Input
                id="chat-search"
                placeholder="Search conversations"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="pl-9 h-9 rounded-lg bg-muted border-0 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-[72px] rounded-lg animate-pulse bg-muted/60"
                  />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-6">
                <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {listSearch
                    ? "No chats match your search"
                    : "No conversations yet"}
                </p>
                {!listSearch && (
                  <Button
                    size="sm"
                    className="rounded-full bg-primary hover:bg-primary/90"
                    onClick={() => setNewChatOpen(true)}
                  >
                    Start chatting
                  </Button>
                )}
              </div>
            ) : (
              <ul>
                {filteredConversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      aria-current={activeConvId === conv.id}
                      onClick={() =>
                        openConversation(
                          conv.id,
                          conv.otherParticipant
                            ? {
                                user_id: conv.otherParticipant.user_id,
                                full_name: conv.otherParticipant.full_name,
                                avatar_url: conv.otherParticipant.avatar_url,
                              }
                            : null,
                        )
                      }
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border/60",
                        activeConvId === conv.id && "bg-accent",
                      )}
                    >
                      <UserAvatar
                        name={conv.otherParticipant?.full_name}
                        avatarUrl={conv.otherParticipant?.avatar_url}
                        className="w-12 h-12 flex-shrink-0"
                        fallbackClassName="bg-primary text-primary-foreground text-sm font-bold"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[15px] text-foreground truncate">
                            {conv.otherParticipant?.full_name || "Unknown"}
                          </span>
                          {conv.lastMessage && (
                            <span
                              className={cn(
                                "text-[11px] flex-shrink-0",
                                conv.unreadCount > 0
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {format(new Date(conv.lastMessage.created_at), "HH:mm")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-[13px] text-muted-foreground truncate">
                            {conv.lastMessage
                              ? conv.lastMessage.sender_id === user?.id
                                ? `You: ${conv.lastMessage.content || "Attachment"}`
                                : conv.lastMessage.content || "Attachment"
                              : "Tap to chat"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 bg-muted/20",
            !activeConvId ? "hidden md:flex" : "flex",
          )}
        >
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center px-6 max-w-sm">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                  Kejetia Messages
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Send private messages to students and providers. Select a chat
                  or start a new conversation.
                </p>
                <Button
                  className="mt-6 rounded-full bg-primary hover:bg-primary/90"
                  onClick={() => setNewChatOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  New chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-3 py-2.5 bg-card flex items-center gap-3 border-b border-border flex-shrink-0">
                <button
                  type="button"
                  onClick={closeChat}
                  aria-label="Back to chat list"
                  className="md:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <UserAvatar
                  name={activePartner?.full_name}
                  avatarUrl={activePartner?.avatar_url}
                  className="w-10 h-10"
                  fallbackClassName="bg-primary text-primary-foreground text-sm font-bold"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-foreground truncate">
                    {activePartner?.full_name || "Conversation"}
                  </p>
                </div>
              </div>

              {/* Messages area */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                aria-live="polite"
                className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-1"
              >
                {conversationLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Spinner className="w-6 h-6" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="bg-card border border-border rounded-lg px-4 py-2 text-xs text-muted-foreground shadow-sm">
                      Messages here are private between you and{" "}
                      {activePartner?.full_name?.split(" ")[0] || "this user"}
                    </div>
                  </div>
                ) : (
                  groupedMessages.map((group) => (
                    <div key={group.date} className="space-y-1">
                      <div className="flex justify-center my-3">
                        <span className="text-[11px] font-medium text-muted-foreground bg-card border border-border px-3 py-1 rounded-full shadow-sm">
                          {group.date}
                        </span>
                      </div>
                      {group.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex mb-1",
                            msg.sender_id === user?.id
                              ? "justify-end"
                              : "justify-start",
                          )}
                        >
                          <MessageBubble
                            msg={msg}
                            isMine={msg.sender_id === user?.id}
                          />
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <ChatComposer
                value={messageText}
                onChange={setMessageText}
                onSend={handleSend}
                sending={sending}
                disabled={!activeConvId}
              />
            </>
          )}
        </div>
      </div>

      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onSelectUser={startChatWithUser}
      />
    </>
  );
}
