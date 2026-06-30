"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RatingDistributionProps {
  avgRating: number;
  totalReviews: number;
  distribution: number[];
}

export function RatingDistribution({
  avgRating,
  totalReviews,
  distribution,
}: RatingDistributionProps) {
  return (
    <Card className="rounded-2xl border border-border/60 p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Big Rating */}
        <div className="text-center lg:text-left lg:min-w-[180px]">
          <div className="text-5xl font-bold text-foreground">
            {avgRating.toFixed(1)}
          </div>
          <div className="flex gap-0.5 justify-center lg:justify-start mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className={cn(
                  "w-6 h-6 transition-all duration-300",
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
          <p className="text-sm text-muted-foreground mt-2">
            Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Right: Distribution Bars */}
        <div className="flex-1 space-y-2.5">
          {[5, 4, 3, 2, 1].map((star, i) => {
            const count = distribution[i] || 0;
            const percentage = totalReviews ? (count / totalReviews) * 100 : 0;
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
  );
}
