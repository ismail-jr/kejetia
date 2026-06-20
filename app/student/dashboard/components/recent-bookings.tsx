"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Booking = {
  id: string;
  status: string;
  amount: number;
  booking_date: string | null;
  profiles?: { full_name: string; avatar_url: string };
  services?: { title: string; category: string; price: number };
};

interface RecentBookingsProps {
  bookings: Booking[];
  loading: boolean;
  statusStyles: Record<string, string>;
}

export function RecentBookings({
  bookings,
  loading,
  statusStyles,
}: RecentBookingsProps) {
  return (
    <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold font-heading text-foreground tracking-tight">
          Recent Bookings
        </h2>
        <Link
          href="/student/bookings"
          className="text-xs font-bold font-heading text-primary hover:underline flex items-center gap-1 tracking-wide uppercase"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse bg-muted" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-10">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">
            No bookings yet
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 font-heading"
            asChild
          >
            <Link href="/student/browse">Browse Services</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const initials =
              booking.profiles?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) || "S";

            return (
              <div
                key={booking.id}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors"
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={booking.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate font-heading leading-tight">
                    {booking.services?.title || "Service"}
                  </p>
                  <p className="text-xs text-muted-foreground/80 font-medium mt-1">
                    {booking.booking_date
                      ? format(new Date(booking.booking_date), "MMM d, yyyy")
                      : "Date TBD"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold tracking-wide capitalize ${statusStyles[booking.status] || ""}`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                  <p className="text-xs font-black text-foreground font-heading">
                    GH₵{booking.amount}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
