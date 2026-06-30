"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listClientBookingsWithDetails,
  updateBookingStatus,
  isReviewEligible,
  type ClientBookingWithDetails,
} from "@/lib/data/bookings";
import { createBookingReview } from "@/lib/data/reviews";
import { BookingCard } from "../browse/components/booking/booking-card";
import { ReviewModal } from "../browse/components/booking/review-modal";

type TabType = "active" | "completed" | "cancelled";

export default function BookingsPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<ClientBookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [reviewTarget, setReviewTarget] =
    useState<ClientBookingWithDetails | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listClientBookingsWithDetails(user.id);
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "cancelled");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      toast.success("Booking cancelled successfully");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!reviewTarget || !user) return;

    if (!isReviewEligible(reviewTarget, reviewTarget.hasReview)) {
      toast.error(
        "You can only review bookings that are completed and marked as paid.",
      );
      return;
    }

    setSubmittingReview(true);
    try {
      await createBookingReview({
        bookingId: reviewTarget.id,
        reviewerId: user.id,
        providerId: reviewTarget.provider_id,
        serviceId: reviewTarget.service_id,
        rating,
        comment,
      });

      toast.success("Review submitted successfully!");
      setReviewTarget(null);
      await fetchBookings();
    } catch (error: unknown) {
      console.error("Error submitting review:", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit review";
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const counts = useMemo(() => {
    let active = 0,
      completed = 0,
      cancelled = 0;
    bookings.forEach((b) => {
      if (["pending", "confirmed", "in_progress"].includes(b.status)) active++;
      else if (b.status === "completed") completed++;
      else if (b.status === "cancelled") cancelled++;
    });
    return { active, completed, cancelled };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (activeTab === "active")
        return ["pending", "confirmed", "in_progress"].includes(b.status);
      if (activeTab === "completed") return b.status === "completed";
      return b.status === "cancelled";
    });
  }, [bookings, activeTab]);

  const TABS = [
    { key: "active" as const, label: "Active", count: counts.active },
    { key: "completed" as const, label: "Completed", count: counts.completed },
    { key: "cancelled" as const, label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your service bookings
        </p>
      </div>

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
            {label}
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
            <div key={i} className="h-44 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No {activeTab} bookings</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              onOpenReview={setReviewTarget}
            />
          ))}
        </div>
      )}

      <ReviewModal
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReviewSubmit}
        isSubmitting={submittingReview}
      />
    </div>
  );
}
