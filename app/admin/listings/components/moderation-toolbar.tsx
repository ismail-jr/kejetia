"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ModerationToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
}

export function ModerationToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: ModerationToolbarProps) {
  const filterTabs = ["all", "pending", "approved", "rejected", "archived"];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, category, or provider..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 rounded-xl"
        />
      </div>
      <div className="flex flex-wrap gap-1 bg-muted rounded-xl p-1 shrink-0">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onFilterChange(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150",
              filter === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
