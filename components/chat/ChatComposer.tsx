"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import type { EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { Smile, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  sending = false,
  disabled = false,
}: ChatComposerProps) {
  const { resolvedTheme } = useTheme();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!emojiOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [emojiOpen]);

  // Grow the textarea with content up to a max height instead of relying
  // on a fixed row count, so multi-line messages stay fully visible.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value]);

  const handleEmojiClick = (emoji: EmojiClickData) => {
    onChange(value + emoji.emoji);
  };

  return (
    <div className="relative px-3 py-2.5 bg-muted/60 border-t border-border">
      {emojiOpen && (
        <div
          ref={emojiRef}
          className="absolute bottom-full left-2 mb-2 z-50 max-w-[calc(100vw-1rem)]"
        >
          <Suspense
            fallback={
              <div className="w-[320px] h-[380px] rounded-lg bg-card border border-border animate-pulse" />
            }
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={(resolvedTheme === "dark" ? "dark" : "light") as Theme}
              width={Math.min(320, typeof window !== "undefined" ? window.innerWidth - 16 : 320)}
              height={380}
              searchPlaceHolder="Search emoji"
              previewConfig={{ showPreview: false }}
            />
          </Suspense>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Add emoji"
          className="h-9 w-9 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setEmojiOpen((o) => !o)}
          disabled={disabled || sending}
        >
          <Smile className="w-5 h-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <label htmlFor="chat-message-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            rows={1}
            placeholder="Type a message"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (value.trim()) onSend();
              }
            }}
            disabled={disabled || sending}
            className={cn(
              "w-full resize-none rounded-2xl border border-border bg-card px-4 py-2.5 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
              "max-h-32 min-h-[42px] transition-colors",
            )}
          />
        </div>

        <Button
          type="button"
          size="icon"
          aria-label="Send message"
          className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0 disabled:opacity-40"
          onClick={onSend}
          disabled={disabled || sending || !value.trim()}
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </Button>
      </div>
    </div>
  );
}
