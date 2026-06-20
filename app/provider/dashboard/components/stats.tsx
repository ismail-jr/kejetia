"use client";

import StatCard from "@/components/dashboard/StatCard";
import { Briefcase, Clock, DollarSign, Star } from "lucide-react";

interface DashboardStatsProps {
  approvedServices: number;
  pendingApproval: number;
  activeOrders: number;
  totalOrdersCount: number;
  totalEarnings: number;
  avgRating: number;
}

export function DashboardStats({
  approvedServices,
  pendingApproval,
  activeOrders,
  totalOrdersCount,
  totalEarnings,
  avgRating,
}: DashboardStatsProps) {
  const getStrokeDashoffset = (percentage: number) =>
    88 - (88 * percentage) / 100;

  const servicesApprovedPercentage =
    approvedServices + pendingApproval > 0
      ? Math.round(
          (approvedServices / (approvedServices + pendingApproval)) * 100,
        )
      : 0;
  const activeOrdersPercentage =
    totalOrdersCount > 0
      ? Math.round((activeOrders / totalOrdersCount) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title="Active Services"
        subtitle="/ Live Catalog"
        value={approvedServices}
        change={pendingApproval > 0 ? `${pendingApproval} pending` : undefined}
        changeType="neutral"
        changeLabel="awaiting admin log"
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
                  strokeDashoffset={getStrokeDashoffset(
                    servicesApprovedPercentage,
                  )}
                />
              </svg>
              <Briefcase className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
        }
      />

      <StatCard
        title="Active Orders"
        subtitle="/ In Flight"
        value={activeOrders}
        change={activeOrders > 0 ? `${activeOrdersPercentage}%` : undefined}
        changeType="neutral"
        changeLabel="of total pipe volume"
        rightElement={
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-9 h-9 flex items-center justify-center text-warning">
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
                  className="stroke-warning transition-all duration-500"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="88"
                  strokeDashoffset={getStrokeDashoffset(activeOrdersPercentage)}
                />
              </svg>
              <Clock className="w-3.5 h-3.5 text-warning" />
            </div>
          </div>
        }
      />

      <StatCard
        title="Total Earnings"
        subtitle="/ Gross Revenue"
        value={`GH₵${totalEarnings.toFixed(0)}`}
        change={totalEarnings > 0 ? "Processed" : undefined}
        changeType="positive"
        changeLabel="Finalized conversions"
        rightElement={
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-9 h-9 flex items-center justify-center text-success">
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
                  className="stroke-success"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="88"
                  strokeDashoffset={totalEarnings > 0 ? "0" : "88"}
                />
              </svg>
              <DollarSign className="w-3.5 h-3.5 text-success" />
            </div>
          </div>
        }
      />

      <StatCard
        title="Avg. Rating"
        subtitle="/ Assessment"
        value={avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
        change={avgRating > 4.0 ? "Top Tier" : undefined}
        changeType="positive"
        changeLabel="Account standing"
        rightElement={
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-9 h-9 flex items-center justify-center text-warning">
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
                  className="stroke-warning"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="88"
                  strokeDashoffset={
                    avgRating > 0
                      ? getStrokeDashoffset((avgRating / 5) * 100)
                      : "88"
                  }
                />
              </svg>
              <Star className="w-3.5 h-3.5 fill-current text-warning" />
            </div>
          </div>
        }
      />
    </div>
  );
}
