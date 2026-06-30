"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  searchMessageableUsers,
  type ConversationParticipantProfile,
} from "@/lib/messaging-data";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: ConversationParticipantProfile) => void;
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

export function NewChatDialog({
  open,
  onOpenChange,
  onSelectUser,
}: NewChatDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConversationParticipantProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchMessageableUsers(query);
        if (!cancelled) setResults(users);
      } catch (err) {
        console.error("User search failed:", err);
        if (!cancelled) toast.error("Could not search users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 rounded-xl"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {query.trim()
                ? "No users found"
                : "Type a name to find someone to message"}
            </p>
          ) : (
            results.map((user) => (
              <Button
                key={user.user_id}
                type="button"
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-3 px-3 rounded-xl"
                onClick={() => {
                  onSelectUser(user);
                  onOpenChange(false);
                }}
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm truncate">
                  {user.full_name}
                </span>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
