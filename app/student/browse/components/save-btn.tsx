"use client";

import { Heart } from "lucide-react";

interface SaveButtonProps {
  isSaved: boolean;
  onToggle: () => void;
}

export function SaveButton({ isSaved, onToggle }: SaveButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2.5 rounded-xl border border-muted transition ${
        isSaved
          ? "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200"
          : "bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
    </button>
  );
}
