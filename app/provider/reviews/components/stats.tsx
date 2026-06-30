"use client";

import { MessageSquare, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import StatCard from "@/components/dashboard/StatCard";

interface ReviewStatsProps {
  avgRating: number;
  totalReviews: number;
  getRatingLabel: () => string;
  trend: { change: string; type: "positive" | "negative" | "neutral" };
}

export function ReviewStats({
  avgRating,
  totalReviews,
  getRatingLabel,
  trend,
}: ReviewStatsProps) {
  const hasReviews = totalReviews > 0;

  if (!hasReviews) return null;

  return (
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
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                className={cn(
                  "w-4 h-4 transition-all duration-300",
                  i < Math.round(avgRating)
                    ? "scale-110 fill-amber-400 text-amber-400"
                    : "opacity-40 text-muted-foreground",
                )}
              >
                <path
                  fill={i < Math.round(avgRating) ? "orange" : "#9ca3af"}
                  d="M9.6 15.65L12 13.8l2.4 1.85l-.9-3.05l2.25-1.6h-2.8L12 7.9l-.95 3.1h-2.8l2.25 1.6zM5.825 21l2.325-7.6L2 9h7.6L12 1l2.4 8H22l-6.15 4.4l2.325 7.6L12 16.3zM12 11.775"
                />
              </svg>
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
  );
}
