"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BookingCard,
  type BookingWithDetails,
} from "../browse/components/booking/booking-card";
import { ReviewModal } from "../browse/components/booking/review-modal";

type TabType = "active" | "completed" | "cancelled";

export default function BookingsPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [reviewTarget, setReviewTarget] = useState<BookingWithDetails | null>(
    null,
  );
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      const serviceIds = [...new Set(bookingsData.map((b) => b.service_id))];
      const providerIds = [...new Set(bookingsData.map((b) => b.provider_id))];
      const bookingIds = bookingsData.map((b) => b.id);

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, title, category, price, images")
        .in("id", serviceIds);

      if (servicesError) throw servicesError;

      // Fetch providers
      const { data: providersData, error: providersError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, location")
        .in("user_id", providerIds);

      if (providersError) throw providersError;

      // Fetch reviews for these bookings
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("booking_id, rating")
        .in("booking_id", bookingIds);

      if (reviewsError) throw reviewsError;

      // Create a map of booking_id -> review data
      const reviewsMap = new Map();
      reviewsData?.forEach((review) => {
        reviewsMap.set(review.booking_id, {
          rating: review.rating,
          hasReview: true,
        });
      });

      const servicesMap = new Map(servicesData?.map((s) => [s.id, s]));
      const providersMap = new Map(providersData?.map((p) => [p.user_id, p]));

      const combinedData: BookingWithDetails[] = bookingsData.map((booking) => {
        const service = servicesMap.get(booking.service_id) || null;
        const review = reviewsMap.get(booking.id);

        return {
          ...booking,
          service: service
            ? {
                ...service,
                // Set avg_rating and total_reviews from the actual review data
                avg_rating: review?.rating || null,
                total_reviews: review?.hasReview ? 1 : 0,
              }
            : null,
          provider: providersMap.get(booking.provider_id) || null,
          // Add review data directly to booking for easy access
          review: review || null,
        };
      });

      setBookings(combinedData);
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
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

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
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: reviewTarget.id,
        reviewer_id: user.id,
        provider_id: reviewTarget.provider_id,
        service_id: reviewTarget.service_id,
        rating: rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setReviewTarget(null);

      // Refresh bookings to show the new review
      await fetchBookings();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
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
