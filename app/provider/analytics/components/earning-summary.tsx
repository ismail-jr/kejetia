"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface EarningsSummaryProps {
  data: { month: string; earnings: number; bookings: number }[];
  totalEarnings: number;
}

export function EarningsSummary({ data, totalEarnings }: EarningsSummaryProps) {
  const currentMonthEarnings = data[data.length - 1]?.earnings || 0;
  const previousMonthEarnings = data[data.length - 2]?.earnings || 0;
  const trend =
    previousMonthEarnings > 0
      ? ((currentMonthEarnings - previousMonthEarnings) /
          previousMonthEarnings) *
        100
      : 0;

  const isPositive = trend >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4 rounded-xl border border-border/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              GH₵{totalEarnings.toFixed(0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-4 rounded-xl border border-border/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {format(subMonths(new Date(), 1), "MMMM")} vs{" "}
              {format(new Date(), "MMMM")}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-foreground">
                {trend > 0 ? `+${trend.toFixed(0)}%` : `${trend.toFixed(0)}%`}
              </p>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  isPositive
                    ? "text-green-600 bg-green-50 dark:bg-green-950/30"
                    : "text-destructive bg-destructive/10",
                )}
              >
                {isPositive ? "Up" : "Down"}
              </span>
            </div>
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isPositive ? "bg-green-500/10" : "bg-destructive/10",
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
