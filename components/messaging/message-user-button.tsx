"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageUserButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
  showIcon?: boolean;
}

export function MessageUserButton({
  targetUserId,
  variant = "outline",
  size = "default",
  className,
  label = "Message",
  showIcon = true,
}: MessageUserButtonProps) {
  const { user, activeRole, loading } = useAuth();
  const router = useRouter();

  if (loading || user?.id === targetUserId) return null;

  const messagesPath =
    activeRole === "provider"
      ? `/provider/messages?with=${targetUserId}`
      : `/student/messages?with=${targetUserId}`;

  if (!user) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        onClick={() => router.push("/login")}
      >
        {showIcon && <MessageSquare className="w-4 h-4" />}
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size={size} className={cn("gap-2", className)}>
      <Link href={messagesPath}>
        {showIcon && <MessageSquare className="w-4 h-4" />}
        {label}
      </Link>
    </Button>
  );
}
