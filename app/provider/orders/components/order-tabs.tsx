// @/components/provider/order-tabs.tsx
"use client";

import { cn } from "@/lib/utils";

export type TabType = "active" | "completed" | "cancelled";

interface OrderTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: { active: number; completed: number; cancelled: number };
}

export function OrderTabs({ activeTab, onTabChange, counts }: OrderTabsProps) {
  const TABS = [
    { key: "active" as const, label: "Active", count: counts.active },
    { key: "completed" as const, label: "Completed", count: counts.completed },
    { key: "cancelled" as const, label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
      {TABS.map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
          {count > 0 && (
            <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
