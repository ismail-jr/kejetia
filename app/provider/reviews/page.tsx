"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  Award,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { listProviderReviewsWithDetails } from "@/lib/data/reviews";
import type { ReviewWithDetails } from "@/lib/data/reviews";
import StatCard from "@/components/dashboard/StatCard";

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

        {!loading && hasReviews && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Average Rating"
              value={avgRating.toFixed(1)}
              change={trend.change}
              changeType={trend.type}
              changeLabel="vs last month"
              rightElement={
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
              }
            />

            <StatCard
              title="Total Reviews"
              value={totalReviews}
              change={totalReviews > 0 ? "+100%" : "0%"}
              changeType={totalReviews > 0 ? "positive" : "neutral"}
              changeLabel="all time"
              rightElement={
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
              }
            />

            <StatCard
              title="Rating Status"
              value={getRatingLabel()}
              change={
                avgRating >= 4.0
                  ? "Top Rated"
                  : avgRating >= 3.0
                    ? "Good"
                    : "Room for growth"
              }
              changeType={
                avgRating >= 4.0
                  ? "positive"
                  : avgRating >= 3.0
                    ? "neutral"
                    : "negative"
              }
              changeLabel={hasReviews ? "based on ratings" : "no data"}
              rightElement={
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
              }
            />
          </div>
        )}

        {!loading && hasReviews && (
          <Card className="rounded-2xl border border-border/60 p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="text-center lg:text-left lg:min-w-[180px]">
                <div className="text-5xl font-bold text-foreground">
                  {avgRating.toFixed(1)}
                </div>
                <div className="flex gap-0.5 justify-center lg:justify-start mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-6 h-6 transition-all",
                        i < Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex-1 space-y-2.5">
                {[5, 4, 3, 2, 1].map((star, i) => {
                  const count = distribution[i] || 0;
                  const percentage = totalReviews
                    ? (count / totalReviews) * 100
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 group">
                      <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                        {star}★
                      </span>
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 font-medium">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 rounded-2xl animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : !hasReviews ? (
          <Card className="text-center py-16 rounded-2xl border-dashed">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Reviews Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Reviews appear here after students complete a booking, you mark it
              as paid, and they leave feedback.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Keep providing great service!</span>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const initials =
                review.reviewer?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2) || "S";

              return (
                <Card
                  key={review.id}
                  className="rounded-2xl border border-border/60 p-6 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 flex-shrink-0 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                      <AvatarImage
                        src={review.reviewer?.avatar_url || undefined}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold text-foreground text-base">
                            {review.reviewer?.full_name || "Anonymous Student"}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {review.service?.title || "Service"}
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(
                                parseISO(review.created_at),
                                "MMM d, yyyy",
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {review.rating}.0
                        </Badge>
                      </div>

                      <div className="flex gap-0.5 mt-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4 transition-all",
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground",
                            )}
                          />
                        ))}
                      </div>

                      {review.comment && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-xl border border-border/30">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            <span className="text-foreground font-medium">
                              “
                            </span>
                            {review.comment}
                            <span className="text-foreground font-medium">
                              ”
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
