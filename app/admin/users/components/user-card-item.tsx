"use client";

import {
  Shield,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Profile, ROLE_STYLES } from "./types";

interface UserCardItemProps {
  user: Profile;
  onUpdateRole: (
    userId: string,
    currentRole: string,
    targetRole: "student" | "provider" | "admin",
  ) => void;
  onToggleVerified: (userId: string, currentStatus: boolean) => void;
}

export function UserCardItem({
  user,
  onUpdateRole,
  onToggleVerified,
}: UserCardItemProps) {
  const initials =
    user.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "U";

  const coreUserId = user.user_id;
  const activeSessionRole = user.active_role || "student";
  const userRolesList =
    user.roles && user.roles.length > 0 ? user.roles : [activeSessionRole];
  const isVerified = !!user.is_verified;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-foreground truncate font-heading">
              {user.full_name || "No name"}
            </p>
            {isVerified && (
              <Shield className="w-3.5 h-3.5 text-primary fill-primary/10" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          {user.student_id && (
            <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
              ID: {user.student_id}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
        <div className="flex flex-wrap items-center gap-1">
          {userRolesList.map((roleString) => {
            const isActive = roleString === activeSessionRole;
            return (
              <span
                key={roleString}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold capitalize tracking-wide border border-transparent",
                  ROLE_STYLES[roleString] || "bg-muted text-muted-foreground",
                  isActive && "ring-1 ring-primary border-background shadow-sm",
                )}
              >
                {roleString}
                {isActive && " • active"}
              </span>
            );
          })}

          <span className="text-xs text-muted-foreground hidden lg:block font-medium ml-2">
            {user.created_at ? format(new Date(user.created_at), "MMM d") : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-border/60 bg-muted/40 rounded-xl p-0.5">
            <Button
              size="icon"
              variant="ghost"
              type="button"
              title="Set Active context to Student"
              className={cn(
                "w-7 h-7 rounded-lg",
                activeSessionRole === "student" &&
                  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              )}
              onClick={() =>
                onUpdateRole(coreUserId, activeSessionRole, "student")
              }
            >
              <GraduationCap className="w-3.5 h-3.5 stroke-[2]" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              title="Set Active context to Provider"
              className={cn(
                "w-7 h-7 rounded-lg",
                activeSessionRole === "provider" &&
                  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
              onClick={() =>
                onUpdateRole(coreUserId, activeSessionRole, "provider")
              }
            >
              <Briefcase className="w-3.5 h-3.5 stroke-[2]" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              title="Set Active context to Admin"
              className={cn(
                "w-7 h-7 rounded-lg",
                activeSessionRole === "admin" &&
                  "bg-red-500/10 text-red-600 dark:text-red-400",
              )}
              onClick={() =>
                onUpdateRole(coreUserId, activeSessionRole, "admin")
              }
            >
              <ShieldAlert className="w-3.5 h-3.5 stroke-[2]" />
            </Button>
          </div>

          <Button
            size="sm"
            variant={isVerified ? "outline" : "ghost"}
            type="button"
            className={cn(
              "h-8 px-3 rounded-xl text-xs flex gap-1.5 font-heading font-medium",
              !isVerified && "hover:bg-primary/5 hover:text-primary",
            )}
            onClick={() => onToggleVerified(coreUserId, isVerified)}
          >
            {isVerified ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Verified
                </span>
              </>
            ) : (
              <>
                <UserX className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span>Verify</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
