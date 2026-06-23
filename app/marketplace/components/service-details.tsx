"use client";

import { Star, Users, Shield } from "lucide-react";

interface ServiceDetailsProps {
  title: string;
  description: string;
  avgRating: string;
  totalReviews: number;
  totalBookings: number;
}

export function ServiceDetails({
  title,
  description,
  avgRating,
  totalReviews,
  totalBookings,
}: ServiceDetailsProps) {
  const rating = parseFloat(avgRating);
  const hasRating = rating > 0;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {title}
          </h1>
          {hasRating && (
            <div className="flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-lg flex-shrink-0">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-sm">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating and Bookings */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {hasRating && (
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)} ({totalReviews} reviews)
          </span>
        )}
      </div>

      {/* Description Card - Similar to price card design */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Description
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
