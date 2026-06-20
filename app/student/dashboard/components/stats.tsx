"use client";

import { Calendar, CheckCircle, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import StatCard from "@/components/dashboard/StatCard";

interface StatsGridProps {
  activeBookings: number;
  completedBookings: number;
  savedCount: number;
  reviewsCount: number;
  totalBookingsCount: number;
  completedBookingsTotal: number;
}

export function StatsGrid({
  activeBookings,
  completedBookings,
  savedCount,
  reviewsCount,
  totalBookingsCount,
  completedBookingsTotal,
}: StatsGridProps) {
  const getStrokeDashoffset = (percentage: number) => {
    return 88 - (88 * percentage) / 100;
  };

  const activePercentage =
    totalBookingsCount > 0
      ? Math.round((activeBookings / totalBookingsCount) * 100)
      : 0;
  const completedPercentage =
    totalBookingsCount > 0
      ? Math.round((completedBookings / totalBookingsCount) * 100)
      : 0;
  const reviewsPercentage =
    completedBookingsTotal > 0
      ? Math.min(100, Math.round((reviewsCount / completedBookingsTotal) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title="Active Bookings"
        subtitle="/ Current"
        value={activeBookings}
        change={activeBookings > 0 ? `${activePercentage}%` : undefined}
        changeType="neutral"
        changeLabel="of total bookings"
        rightElement={
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-9 h-9 flex items-center justify-center text-primary">
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-muted"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-primary transition-all duration-500"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="88"
                  strokeDashoffset={getStrokeDashoffset(activePercentage)}
                />
              </svg>
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        }
      />

      <StatCard
        title="Completed"
        subtitle="/ Total"
        value={completedBookings}
        change={completedBookings > 0 ? `${completedPercentage}%` : undefined}
        changeType="positive"
        changeLabel="success rate"
        rightElement={
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-9 h-9 flex items-center justify-center text-emerald-500">
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-muted"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-emerald-500 transition-all duration-500"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="88"
                  strokeDashoffset={getStrokeDashoffset(completedPercentage)}
                />
              </svg>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        }
      />

      <StatCard
        title="Saved Services"
        subtitle="/ Marketplace"
        value={savedCount}
        change={savedCount > 0 ? `+${savedCount}` : undefined}
        changeType="positive"
        changeLabel="items watchlisted"
        rightElement={
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-9 h-9 flex items-center justify-center text-rose-500">
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-muted"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-rose-500 transition-all duration-500"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="88"
                  strokeDashoffset={savedCount > 0 ? "35" : "88"}
                />
              </svg>
              <Heart
                className={cn(
                  "w-3.5 h-3.5 text-rose-500",
                  savedCount > 0 && "fill-current",
                )}
              />
            </div>
          </div>
        }
      />

      <StatCard
        title="Reviews Given"
        subtitle="/ Evaluation"
        value={reviewsCount}
        change={reviewsCount > 0 ? `${reviewsPercentage}%` : undefined}
        changeType="neutral"
        changeLabel="completion rate"
        rightElement={
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-9 h-9 flex items-center justify-center text-amber-500">
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-muted"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-amber-500 transition-all duration-500"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="88"
                  strokeDashoffset={getStrokeDashoffset(reviewsPercentage)}
                />
              </svg>
              <Star
                className={cn(
                  "w-3.5 h-3.5 text-amber-500",
                  reviewsCount > 0 && "fill-current",
                )}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
