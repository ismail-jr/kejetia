"use client";

import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  bookings: any[];
  loading: boolean;
}

const STATUS_ICONS = {
  pending: { icon: Clock, color: "text-amber-500" },
  confirmed: { icon: CheckCircle, color: "text-blue-500" },
  in_progress: { icon: Loader2, color: "text-primary" },
  completed: { icon: CheckCircle, color: "text-green-500" },
  cancelled: { icon: AlertCircle, color: "text-destructive" },
};

export function RecentActivity({ bookings, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.slice(0, 5).map((booking) => {
        const statusConfig =
          STATUS_ICONS[booking.status as keyof typeof STATUS_ICONS] ||
          STATUS_ICONS.pending;
        const StatusIcon = statusConfig.icon;
        const initials =
          booking.student?.full_name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2) || "S";

        return (
          <div
            key={booking.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={booking.student?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {booking.services?.title || "Service"}
              </p>
              <p className="text-xs text-muted-foreground">
                {booking.student?.full_name || "Unknown"} •{" "}
                {format(parseISO(booking.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs"
            >
              <StatusIcon className={cn("w-3 h-3", statusConfig.color)} />
              <span className="capitalize">
                {booking.status.replace("_", " ")}
              </span>
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
