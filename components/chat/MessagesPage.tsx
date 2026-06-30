"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
} from "@/lib/messaging-data";
import { getPartySummaries } from "@/lib/data/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
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

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<ActivePartner | null>(
    null,
  );
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convos = await listConversations();
      setConversations(convos);
    } catch (err) {
      console.error("Failed to load conversations:", err);
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
      }
    },
    [fetchConversations],
  );

  // Deep-link: ?with=<userId> opens (or creates) a direct conversation.
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
          : {
              user_id: targetId,
              full_name: "User",
              avatar_url: null,
            };
        await openConversation(convId, partner);
      } catch (err) {
        console.error("Failed to start conversation:", err);
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

  // Realtime: append newly inserted messages for the open conversation.
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
        (payload) => {
          const incoming = payload.new as MessageWithSender;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id)
              ? prev
              : [...prev, { ...incoming, sender: null }],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConvId]);

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
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-0 bg-card rounded-2xl border border-border overflow-hidden">
      {/* Conversations list */}
      <div
        className={cn(
          "w-full sm:w-72 lg:w-80 border-r border-border flex flex-col",
          activeConvId ? "hidden sm:flex" : "flex",
        )}
      >
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
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
                  "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left",
                  activeConvId === conv.id && "bg-muted",
                )}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage
                    src={conv.otherParticipant?.avatar_url || undefined}
                  />{" "}
                  <AvatarFallback className="bg-primary text-white text-sm font-bold">
                    {initials(conv.otherParticipant?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">
                      {conv.otherParticipant?.full_name || "Unknown"}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {format(
                          new Date(conv.lastMessage.created_at),
                          "HH:mm",
                        )}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage.content || "Attachment"}
                    </p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {conv.unreadCount}
                    </span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          !activeConvId ? "hidden sm:flex" : "flex",
        )}
      >
        {!activeConvId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-1">
                Select a conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <button
                onClick={() => setActiveConvId(null)}
                className="sm:hidden mr-1 text-muted-foreground"
              >
                ←
              </button>
              <Avatar className="w-9 h-9">
                <AvatarImage src={activePartner?.avatar_url || undefined} />{" "}
                <AvatarFallback className="bg-primary text-white text-sm font-bold">
                  {initials(activePartner?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {activePartner?.full_name || "Conversation"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      isMine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                        isMine
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md",
                      )}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isMine ? "text-white/60" : "text-muted-foreground",
                        )}
                      >
                        {format(new Date(msg.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="rounded-xl h-10"
              />
              <Button
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
                size="icon"
                className="h-10 w-10 rounded-xl shadow-primary flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
