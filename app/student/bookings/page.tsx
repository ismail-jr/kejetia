"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Star, MessageSquare, X, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  services?: {
    id: string;
    title: string;
    category: string;
    price: number;
    images: string[];
  };
  provider?: { full_name: string; avatar_url: string };
};

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  pending: {
    label: "Pending",
    style:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  confirmed: {
    label: "Confirmed",
    style: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  in_progress: { label: "In Progress", style: "bg-primary/10 text-primary" },
  completed: {
    label: "Completed",
    style:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  cancelled: {
    label: "Cancelled",
    style: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "active" | "completed" | "cancelled"
  >("active");
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select(
        `
        *,
        services(id, title, category, price, images),
        provider:profiles!bookings_provider_id_fkey(full_name, avatar_url)
      `,
      )
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    const { error } = await (supabase.from("bookings") as any)
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    if (!error) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      toast.success("Booking cancelled");
    }
  };

  const handleReview = async () => {
    if (!reviewTarget || !user) return;
    setSubmittingReview(true);
    try {
      const { error } = await (supabase.from("reviews") as any).insert({
        booking_id: reviewTarget.id,
        reviewer_id: user.id,
        provider_id: reviewTarget.provider_id,
        service_id: reviewTarget.service_id,
        rating,
        comment,
      });
      if (error) throw error;
      toast.success("Review submitted!");
      setReviewTarget(null);
      setRating(5);
      setComment("");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === "active")
      return ["pending", "confirmed", "in_progress"].includes(b.status);
    if (activeTab === "completed") return b.status === "completed";
    return b.status === "cancelled";
  });

  const TABS = [
    {
      key: "active",
      label: "Active",
      count: bookings.filter((b) =>
        ["pending", "confirmed", "in_progress"].includes(b.status),
      ).length,
    },
    {
      key: "completed",
      label: "Completed",
      count: bookings.filter((b) => b.status === "completed").length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: bookings.filter((b) => b.status === "cancelled").length,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your service bookings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}{" "}
            {count > 0 && (
              <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No {activeTab} bookings</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const status = STATUS_MAP[booking.status];
            const providerInitials =
              booking.provider?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) || "P";
            return (
              <div
                key={booking.id}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={booking.provider?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {providerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground">
                        {(booking as any).services?.title}
                      </h3>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0",
                          status.style,
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Provider: {booking.provider?.full_name}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <span>GH₵ {Number(booking.amount).toFixed(2)}</span>
                      {booking.booking_date && (
                        <span>
                          {format(
                            new Date(booking.booking_date),
                            "MMM d, yyyy h:mm a",
                          )}
                        </span>
                      )}
                      <span>
                        Booked{" "}
                        {format(new Date(booking.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {booking.notes && (
                      <p className="text-xs text-muted-foreground mt-2 bg-muted rounded-lg px-3 py-2">
                        Note: {booking.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() =>
                      (location.href = `/student/messages?with=${booking.provider_id}`)
                    }
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Message
                  </Button>
                  {booking.status === "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setReviewTarget(booking)}
                    >
                      <Star className="w-3.5 h-3.5 mr-1.5" />
                      Leave Review
                    </Button>
                  )}
                  {["pending", "confirmed"].includes(booking.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl text-destructive hover:text-destructive"
                      onClick={() => handleCancel(booking.id)}
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} onClick={() => setRating(r)}>
                    <Star
                      className={cn(
                        "w-8 h-8 transition-all",
                        r <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground hover:text-amber-300",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={submittingReview}
              className="shadow-primary"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
