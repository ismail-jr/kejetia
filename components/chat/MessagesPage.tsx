"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Conversation {
  id: string;
  participant: Profile;
  lastMessage: Message | null;
  unread: number;
}

function getConversationId(a: string, b: string): string {
  return [a, b].sort().join("_");
}

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!msgs) return;

    const convoMap = new Map<
      string,
      { messages: Message[]; partnerId: string }
    >();
    msgs.forEach((msg) => {
      if (!convoMap.has(msg.conversation_id)) {
        const partnerId =
          msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        convoMap.set(msg.conversation_id, { messages: [msg], partnerId });
      } else {
        convoMap.get(msg.conversation_id)!.messages.push(msg);
      }
    });

    const allValues = Array.from(convoMap.values());
    const partnerIds = Array.from(new Set(allValues.map((c) => c.partnerId)));
    const { data: partners } = await supabase
      .from("profiles")
      .select("*")
      .in("id", partnerIds);
    const partnerMap = new Map(partners?.map((p) => [p.id, p]) || []);

    const convos: Conversation[] = Array.from(convoMap.entries())
      .map(([id, { messages, partnerId }]) => ({
        id,
        participant: partnerMap.get(partnerId)!,
        lastMessage: messages[0],
        unread: messages.filter(
          (m: any) => m.receiver_id === user.id && !m.is_read,
        ).length,
      }))
      .filter((c) => c.participant);

    setConversations(convos);
    setLoading(false);
  }, [user]);

  const loadConversation = useCallback(
    async (convId: string, partner: Profile) => {
      setActiveConvId(convId);
      setActivePartner(partner);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      // Mark as read
      if (user) {
        await (supabase.from("messages") as any)
          .update({ is_read: true })
          .eq("conversation_id", convId)
          .eq("receiver_id", user.id);
      }
    },
    [user],
  );

  const initWithUser = useCallback(
    async (targetId: string) => {
      if (!user) return;
      const convId = getConversationId(user.id, targetId);
      const { data: partner } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();
      if (partner) {
        loadConversation(convId, partner);
      }
    },
    [user, loadConversation],
  );

  useEffect(() => {
    fetchConversations();
    if (withUserId) initWithUser(withUserId);
  }, [fetchConversations, withUserId, initWithUser]);

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
          setMessages((prev) => [...prev, payload.new as Message]);
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

  const sendMessage = async () => {
    if (!user || !activePartner || !messageText.trim()) return;
    const convId = getConversationId(user.id, activePartner.id);
    setSending(true);
    const { error } = await (supabase.from("messages") as any).insert({
      conversation_id: convId,
      sender_id: user.id,
      receiver_id: activePartner.id,
      content: messageText.trim(),
    });
    if (!error) {
      setMessageText("");
      fetchConversations();
    }
    setSending(false);
  };

  const partnerInitials = (p: Profile) =>
    p.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "U";

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
                onClick={() => loadConversation(conv.id, conv.participant)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left",
                  activeConvId === conv.id && "bg-muted",
                )}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={conv.participant.avatar_url || undefined} />{" "}
                  <AvatarFallback className="bg-primary text-white text-sm font-bold">
                    {partnerInitials(conv.participant)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">
                      {conv.participant.full_name}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {format(new Date(conv.lastMessage.created_at), "HH:mm")}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {conv.unread}
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
        {!activePartner ? (
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
                <AvatarImage src={activePartner.avatar_url || undefined} />{" "}
                <AvatarFallback className="bg-primary text-white text-sm font-bold">
                  {partnerInitials(activePartner)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {activePartner.full_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {activePartner.active_role}{" "}
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
                    sendMessage();
                  }
                }}
                className="rounded-xl h-10"
              />
              <Button
                onClick={sendMessage}
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
