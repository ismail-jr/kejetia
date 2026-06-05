"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  reviewer?: { full_name: string; avatar_url: string };
  services?: { title: string };
};

export default function ProviderReviewsPage() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [distribution, setDistribution] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("reviews")
        .select(
          `
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url),
          services(title)
        `,
        )
        .eq("provider_id", profile.id)
        .order("created_at", { ascending: false });

      if (data) {
        setReviews(data as Review[]);
        if (data.length > 0) {
          const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
          setAvgRating(avg);
          const dist = [0, 0, 0, 0, 0];
          data.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
          });
          setDistribution(dist.reverse());
        }
      }
      setLoading(false);
    };
    fetchReviews();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground mt-1">
          See what students say about your services
        </p>
      </div>

      {/* Summary card */}
      {reviews.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="text-center sm:text-left">
              <div className="text-5xl font-bold text-foreground">
                {avgRating.toFixed(1)}
              </div>
              <div className="flex gap-0.5 justify-center sm:justify-start mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i < Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground",
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {reviews.length} reviews total
              </p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star, i) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {star}★
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{
                        width: `${reviews.length ? (distribution[i] / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-6">
                    {distribution[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold">No reviews yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            Reviews will appear here after students complete bookings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-card rounded-2xl border border-border p-5"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={review.reviewer?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {review.reviewer?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium text-sm">
                        {review.reviewer?.full_name}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {(review as any).services?.title}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex gap-0.5 my-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground",
                        )}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
