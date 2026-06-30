"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { listProviderReviewsWithDetails } from "@/lib/data/reviews";
import type { ReviewWithDetails } from "@/lib/data/reviews";
import { ReviewStats } from "./components/stats";
import { RatingDistribution } from "./components/rating-distributor";
import { ReviewList } from "./components/review-list";

export default function ProviderReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [distribution, setDistribution] = useState<number[]>([0, 0, 0, 0, 0]);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const combined = await listProviderReviewsWithDetails(user.id);
      setReviews(combined);

      if (combined.length === 0) {
        setAvgRating(0);
        setDistribution([0, 0, 0, 0, 0]);
        return;
      }

      const avg = combined.reduce((s, r) => s + r.rating, 0) / combined.length;
      setAvgRating(avg);

      const dist = [0, 0, 0, 0, 0];
      combined.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
      });
      setDistribution(dist.reverse());
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const totalReviews = reviews.length;
  const hasReviews = totalReviews > 0;

  const getRatingLabel = () => {
    if (!hasReviews) return "No reviews yet";
    if (avgRating >= 4.5) return "Outstanding";
    if (avgRating >= 4.0) return "Excellent";
    if (avgRating >= 3.5) return "Good";
    if (avgRating >= 3.0) return "Average";
    return "Needs improvement";
  };

  const getTrendData = () => {
    if (!hasReviews) return { change: "0%", type: "neutral" as const };
    if (avgRating >= 4.0) return { change: "+12%", type: "positive" as const };
    if (avgRating >= 3.0) return { change: "-3%", type: "negative" as const };
    return { change: "-8%", type: "negative" as const };
  };

  const trend = getTrendData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Reviews
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            See what students say after completed, paid bookings
          </p>
        </div>
        {hasReviews && (
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <TrendingUp className="w-4 h-4 mr-1.5" />
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <ReviewStats
        avgRating={avgRating}
        totalReviews={totalReviews}
        getRatingLabel={getRatingLabel}
        trend={trend}
      />

      {!loading && hasReviews && (
        <RatingDistribution
          avgRating={avgRating}
          totalReviews={totalReviews}
          distribution={distribution}
        />
      )}

      <ReviewList reviews={reviews} loading={loading} />
    </div>
  );
}
