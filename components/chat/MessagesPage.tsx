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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  Plus,
  Search,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ActivePartner {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

function initials(name?: string | null) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "U"
  );
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
  const hasAudio =
    msg.attachments?.length > 0 &&
    msg.attachments.some((url) =>
      /\.(webm|ogg|mp3|wav|m4a)(\?|$)/i.test(url),
    );

  return (
    <div
      className={cn(
        "max-w-[78%] sm:max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm relative",
        isMine
          ? "bg-[#d9fdd3] dark:bg-emerald-900/50 text-foreground rounded-tr-none ml-auto"
          : "bg-white dark:bg-card text-foreground rounded-tl-none",
      )}
    >
      {hasAudio ? (
        <div className="py-1 min-w-[200px]">
          <audio
            controls
            src={msg.attachments[0]}
            className="w-full h-9"
            preload="metadata"
          />
        </div>
      ) : msg.content ? (
        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">
          {msg.content}
        </p>
      ) : msg.attachments?.length > 0 ? (
        <p className="text-sm italic text-muted-foreground">Voice message</p>
      ) : null}

      <p
        className={cn(
          "text-[10px] text-right mt-0.5 select-none",
          isMine ? "text-emerald-800/60 dark:text-emerald-200/60" : "text-muted-foreground",
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
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convos = await listConversations();
      setConversations(convos);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const openConversation = useCallback(
    async (convId: string, partner: ActivePartner | null) => {
      setActiveConvId(convId);
      setActivePartner(partner);
      try {
        const msgs = await getMessages(convId);
        setMessages(msgs);
        await markConversationRead(convId);
        fetchConversations();
      } catch (err) {
        console.error("Failed to open conversation:", err);
        toast.error("Failed to open conversation");
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
        await fetchConversations();
      } catch (err) {
        console.error("Failed to start conversation:", err);
        toast.error("Could not start conversation");
      }
    },
    [user, openConversation, fetchConversations],
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
        console.error("Failed to start conversation:", err);
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
  }, [withUserId, initWithUser]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !activeConvId || !messageText.trim()) return;
    setSending(true);
    try {
      const sent = await sendMessageApi(activeConvId, messageText.trim());
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
      setMessageText("");
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendVoice = async (file: File) => {
    if (!user || !activeConvId) return;
    setSending(true);
    try {
      const sent = await sendMessageApi(activeConvId, null, [file]);
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
      fetchConversations();
      toast.success("Voice message sent");
    } catch (err) {
      console.error("Failed to send voice message:", err);
      toast.error("Failed to send voice message. Check microphone permissions.");
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
      <div className="h-full flex overflow-hidden rounded-xl border border-border/60 shadow-sm bg-[#f0f2f5] dark:bg-background">
        {/* Sidebar — WhatsApp chat list */}
        <div
          className={cn(
            "w-full md:w-[340px] lg:w-[380px] flex flex-col border-r border-border/50 bg-white dark:bg-card",
            activeConvId ? "hidden md:flex" : "flex",
          )}
        >
          <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-muted flex items-center justify-between gap-2 border-b border-border/40">
            <h2 className="font-semibold text-foreground text-lg">Chats</h2>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full"
              onClick={() => setNewChatOpen(true)}
              title="New chat"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="px-3 py-2 bg-white dark:bg-card border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search or start new chat"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="pl-9 h-9 rounded-lg bg-[#f0f2f5] dark:bg-muted border-0 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[72px] rounded-lg animate-pulse bg-muted/60" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-6">
                <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {listSearch ? "No chats match your search" : "No conversations yet"}
                </p>
                {!listSearch && (
                  <Button
                    size="sm"
                    className="rounded-full bg-[#00a884] hover:bg-[#008f72]"
                    onClick={() => setNewChatOpen(true)}
                  >
                    Start chatting
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
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
                    "w-full flex items-center gap-3 px-3 py-3 hover:bg-[#f5f6f6] dark:hover:bg-muted/50 transition-colors text-left border-b border-border/30",
                    activeConvId === conv.id && "bg-[#f0f2f5] dark:bg-muted",
                  )}
                >
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={conv.otherParticipant?.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#00a884] text-white text-sm font-bold">
                      {initials(conv.otherParticipant?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 border-b border-transparent">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[15px] text-foreground truncate">
                        {conv.otherParticipant?.full_name || "Unknown"}
                      </span>
                      {conv.lastMessage && (
                        <span
                          className={cn(
                            "text-[11px] flex-shrink-0",
                            conv.unreadCount > 0
                              ? "text-[#00a884] font-medium"
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
                            ? `✓ ${conv.lastMessage.content || "🎤 Voice message"}`
                            : conv.lastMessage.content || "🎤 Voice message"
                          : "Tap to chat"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-[#25d366] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            !activeConvId ? "hidden md:flex" : "flex",
          )}
        >
          {!activeConvId ? (
            <div
              className="flex-1 flex flex-col items-center justify-center border-l border-border/30"
              style={{
                backgroundColor: "#efeae2",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              <div className="text-center px-6 max-w-sm">
                <div className="w-20 h-20 rounded-full bg-[#00a884]/10 flex items-center justify-center mx-auto mb-5">
                  <MessageSquare className="w-10 h-10 text-[#00a884]" />
                </div>
                <h3 className="text-xl font-light text-foreground mb-2">
                  Kejetia Messages
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Send private messages to students and providers. Select a chat
                  or start a new conversation.
                </p>
                <Button
                  className="mt-6 rounded-full bg-[#00a884] hover:bg-[#008f72]"
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
              <div className="px-3 py-2 bg-[#f0f2f5] dark:bg-muted flex items-center gap-3 border-b border-border/40 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeChat}
                  className="md:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activePartner?.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#00a884] text-white text-sm font-bold">
                    {initials(activePartner?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-foreground truncate">
                    {activePartner?.full_name || "Conversation"}
                  </p>
                  <p className="text-xs text-muted-foreground">online</p>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              {/* Messages area */}
              <div
                className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-1 dark:bg-muted/20"
                style={{
                  backgroundColor: "#efeae2",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cdc4' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="bg-white/80 dark:bg-card/80 rounded-lg px-4 py-2 text-xs text-muted-foreground shadow-sm">
                      Messages are end-to-end private between you and{" "}
                      {activePartner?.full_name?.split(" ")[0] || "this user"}
                    </div>
                  </div>
                ) : (
                  groupedMessages.map((group) => (
                    <div key={group.date} className="space-y-1">
                      <div className="flex justify-center my-3">
                        <span className="text-[11px] font-medium text-muted-foreground bg-white/90 dark:bg-card/90 px-3 py-1 rounded-lg shadow-sm">
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
                onSendVoice={handleSendVoice}
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
