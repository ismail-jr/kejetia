"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModerationHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function ModerationHeader({
  onRefresh,
  loading,
}: ModerationHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          System Moderation
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Review, approve, reject or archive platform service items
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onRefresh}
        className="rounded-xl gap-2"
        disabled={loading}
      >
        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        Force Reload
      </Button>
    </div>
  );
}
