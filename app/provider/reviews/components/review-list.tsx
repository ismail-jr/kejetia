"use client";

import { format, parseISO } from "date-fns";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: { full_name: string | null; avatar_url: string | null } | null;
  service?: { title: string } | null;
}

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
}

export function ReviewList({ reviews, loading }: ReviewListProps) {
  if (loading) {
    return (
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
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="text-center py-16 rounded-2xl border-dashed">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            className="text-muted-foreground"
          >
            <path
              fill="currentColor"
              d="M9.6 15.65L12 13.8l2.4 1.85l-.9-3.05l2.25-1.6h-2.8L12 7.9l-.95 3.1h-2.8l2.25 1.6zM5.825 21l2.325-7.6L2 9h7.6L12 1l2.4 8H22l-6.15 4.4l2.325 7.6L12 16.3zM12 11.775"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Reviews Yet
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Reviews appear here after students complete a booking, you mark it as
          paid, and they leave feedback.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Keep providing great service!</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        return (
          <Card
            key={review.id}
            className="rounded-2xl border border-border/60 p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <UserAvatar
                name={review.reviewer?.full_name}
                avatarUrl={review.reviewer?.avatar_url}
                fallbackText="S"
                className="w-12 h-12 flex-shrink-0 ring-2 ring-primary/10 ring-offset-2 ring-offset-background"
                fallbackClassName="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm"
              />

              <div className="flex-1 min-w-0">
                {/* Header */}
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
                        {format(parseISO(review.created_at), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      className="fill-amber-400 text-amber-400"
                    >
                      <path
                        fill="currentColor"
                        d="M9.6 15.65L12 13.8l2.4 1.85l-.9-3.05l2.25-1.6h-2.8L12 7.9l-.95 3.1h-2.8l2.25 1.6zM5.825 21l2.325-7.6L2 9h7.6L12 1l2.4 8H22l-6.15 4.4l2.325 7.6L12 16.3zM12 11.775"
                      />
                    </svg>
                    {review.rating}.0
                  </Badge>
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      className={`transition-all duration-300 ${
                        i < review.rating ? "scale-110" : "opacity-40"
                      } group-hover:scale-110`}
                    >
                      <path
                        fill={i < review.rating ? "orange" : "#9ca3af"}
                        d="M9.6 15.65L12 13.8l2.4 1.85l-.9-3.05l2.25-1.6h-2.8L12 7.9l-.95 3.1h-2.8l2.25 1.6zM5.825 21l2.325-7.6L2 9h7.6L12 1l2.4 8H22l-6.15 4.4l2.325 7.6L12 16.3zM12 11.775"
                      />
                    </svg>
                  ))}
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-xl border border-border/30">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-medium">“</span>
                      {review.comment}
                      <span className="text-foreground font-medium">”</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
