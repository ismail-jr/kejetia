"use client";

import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ProfileHeaderProps {
  isProvider: boolean;
  currentRole: string;
}

export function ProfileHeader({ isProvider, currentRole }: ProfileHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isProvider ? "Provider Profile" : "Student Profile"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isProvider
              ? "Your public provider listing — clients see this when browsing services."
              : "Your campus identity — visible to providers and peers."}
          </p>
        </div>
        <Badge
          className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border-0 capitalize ${
            isProvider
              ? "bg-amber-500/12 text-amber-600 dark:text-amber-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          {isProvider ? (
            <Briefcase className="w-3 h-3 mr-1.5 inline" />
          ) : (
            <GraduationCap className="w-3 h-3 mr-1.5 inline" />
          )}
          {currentRole} mode
        </Badge>
      </div>

      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
          isProvider
            ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300"
            : "bg-primary/5 border-primary/15 text-primary/80"
        }`}
      >
        {isProvider ? (
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
        )}
        <span>
          {isProvider
            ? "You're editing your provider listing. Changes here are visible to potential clients browsing the marketplace."
            : "You're editing your student profile. Switch to provider mode from the sidebar to manage your service listings."}
        </span>
      </div>
    </div>
  );
}
