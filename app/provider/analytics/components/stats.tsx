"use client";

import StatCard from "@/components/dashboard/StatCard";
import {
  DollarSign,
  Star,
  Users,
  TrendingUp,
  Briefcase,
  Calendar,
} from "lucide-react";

interface AnalyticsStatsProps {
  stats: {
    totalEarnings: number;
    totalBookings: number;
    completedBookings: number;
    avgRating: number;
    totalReviews: number;
    totalServices: number;
  };
}

export function AnalyticsStats({ stats }: AnalyticsStatsProps) {
  const completionRate =
    stats.totalBookings > 0
      ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <StatCard
        title="Total Earnings"
        value={`GH₵${stats.totalEarnings.toFixed(0)}`}
        rightElement={
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
        }
      />

      <StatCard
        title="Total Bookings"
        value={stats.totalBookings}
        change={`${stats.completedBookings} completed`}
        changeType="positive"
        rightElement={
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
        }
      />

      <StatCard
        title="Avg. Rating"
        value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
        change={`${stats.totalReviews} reviews`}
        changeType="neutral"
        rightElement={
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
        }
      />

      <StatCard
        title="Active Services"
        value={stats.totalServices}
        rightElement={
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-500" />
          </div>
        }
      />

      <StatCard
        title="Completion Rate"
        value={stats.totalBookings > 0 ? `${completionRate}%` : "N/A"}
        change={completionRate >= 70 ? "Good progress" : "Room for growth"}
        changeType={completionRate >= 70 ? "positive" : "neutral"}
        rightElement={
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-cyan-500" />
          </div>
        }
      />
    </div>
  );
}
