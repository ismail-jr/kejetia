"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FilterTab, TABS } from "./types";

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: FilterTab;
  onFilterChange: (tab: FilterTab) => void;
}

export function UserFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 rounded-xl"
        />
      </div>
      <div className="flex gap-1 bg-muted rounded-xl p-1 self-start sm:self-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onFilterChange(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
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
