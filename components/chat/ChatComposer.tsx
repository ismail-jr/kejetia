"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { Mic, Smile, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSendVoice: (file: File) => void;
  sending?: boolean;
  disabled?: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onSendVoice,
  sending = false,
  disabled = false,
}: ChatComposerProps) {
  const { resolvedTheme } = useTheme();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    chunksRef.current = [];
    stopRecording();
    setRecording(false);
    setRecordSeconds(0);
  }, [stopRecording]);

  const startRecording = async () => {
    if (disabled || sending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        setRecording(false);
        setRecordSeconds(0);

        if (blob.size > 0) {
          const file = new File([blob], `voice-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          onSendVoice(file);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access is required for voice messages");
      setRecording(false);
    }
  };

  useEffect(() => {
    return () => stopRecording();
  }, [stopRecording]);

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

  const handleEmojiClick = (emoji: EmojiClickData) => {
    onChange(value + emoji.emoji);
  };

  const formatRecordTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (recording) {
    return (
      <div className="px-3 py-2 bg-[#f0f2f5] dark:bg-muted border-t border-border/60 flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
          onClick={cancelRecording}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-foreground">
            Recording {formatRecordTime(recordSeconds)}
          </span>
        </div>
        <Button
          type="button"
          size="icon"
          className="h-10 w-10 rounded-full bg-primary"
          onClick={stopRecording}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative px-3 py-2 bg-[#f0f2f5] dark:bg-muted border-t border-border/60">
      {emojiOpen && (
        <div ref={emojiRef} className="absolute bottom-full left-2 mb-2 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
            width={320}
            height={380}
            searchPlaceHolder="Search emoji"
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setEmojiOpen((o) => !o)}
          disabled={disabled || sending}
        >
          <Smile className="w-5 h-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <textarea
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
              "w-full resize-none rounded-2xl border-0 bg-white dark:bg-card px-4 py-2.5 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30",
              "max-h-32 min-h-[42px]",
            )}
          />
        </div>

        {value.trim() ? (
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 rounded-full bg-[#00a884] hover:bg-[#008f72] flex-shrink-0"
            onClick={onSend}
            disabled={disabled || sending || !value.trim()}
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={startRecording}
            disabled={disabled || sending}
            title="Record voice message"
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
