"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  subtitle?: string; // e.g., "/ Day" or "Travel and tourism"
  value: string | number;
  change?: string; // e.g., "+23%" or "$33.2k"
  changeType?: "positive" | "negative" | "neutral";
  changeLabel?: string; // e.g., "last week" or "Recurring Revenue"
  rightElement?: React.ReactNode; // Slot for custom mini sparklines, engagement rings, or company logo icons
  className?: string;
}

export default function StatCard({
  title,
  subtitle,
  value,
  change,
  changeType = "neutral",
  changeLabel,
  rightElement,
  className,
}: StatCardProps) {
  const trendStyles = {
    positive:
      "text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10",
    negative:
      "text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10",
    neutral: "text-muted-foreground bg-muted/50 border border-border/40",
  };

  const TrendIcon = () => {
    if (changeType === "positive")
      return <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />;
    if (changeType === "negative")
      return <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground/60" />;
  };

  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-2xl border border-border/60 p-6 flex items-stretch justify-between shadow-sm hover:shadow-md transition-all duration-200 min-h-[140px]",
        className,
      )}
    >
      {/* Left Data Presentation Track */}
      <div className="flex flex-col justify-between flex-1 min-w-0 pr-2">
        {/* Header Titles */}
        <div>
          <span className="text-sm font-bold font-heading text-foreground tracking-tight">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs font-semibold text-muted-foreground/60 ml-1">
              {subtitle}
            </span>
          )}
        </div>

        {/* Central Prominent Metrics block */}
        <div className="my-auto py-2">
          <p className="text-3xl font-black text-foreground tracking-tight leading-none font-heading">
            {value}
          </p>
        </div>

        {/* Footnote Trends and Metadata Indicators */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold tracking-tight text-[11px]",
                trendStyles[changeType],
              )}
            >
              <TrendIcon />
              {change}
            </span>
          )}
          {changeLabel && (
            <span className="text-muted-foreground/60 tracking-tight font-medium">
              {changeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Right Visual Graphic Component Track */}
      {rightElement && (
        <div className="flex flex-col items-end justify-center shrink-0 pl-2">
          {rightElement}
        </div>
      )}
    </div>
  );
}
