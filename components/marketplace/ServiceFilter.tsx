"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface ServiceFilters {
  search: string;
  selectedTags: string[];
  minPrice: number;
  maxPrice: number;
  sortBy: string;
  minRating: number;
}

interface ServiceFilterProps {
  filters: ServiceFilters;
  onChange: (filters: ServiceFilters) => void;
}

export default function ServiceFilter({
  filters,
  onChange,
}: ServiceFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  // Fetch all unique tags from services
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const { data, error } = await supabase
          .from("services")
          .select("tags")
          .eq("status", "approved");

        if (error) throw error;

        // Collect all unique tags from all services
        const allTags = new Set<string>();
        data?.forEach((service) => {
          if (service.tags && Array.isArray(service.tags)) {
            service.tags.forEach((tag: string) =>
              allTags.add(tag.toLowerCase()),
            );
          }
        });

        // Convert to array and sort alphabetically
        const sortedTags = Array.from(allTags).sort();
        setAvailableTags(sortedTags);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  const update = (partial: Partial<ServiceFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleTag = (tag: string) => {
    if (filters.selectedTags.includes(tag)) {
      update({ selectedTags: filters.selectedTags.filter((t) => t !== tag) });
    } else {
      update({ selectedTags: [...filters.selectedTags, tag] });
    }
  };

  const resetFilters = () => {
    onChange({
      search: "",
      selectedTags: [],
      minPrice: 0,
      maxPrice: 500,
      sortBy: "newest",
      minRating: 0,
    });
  };

  const hasActiveFilters =
    filters.selectedTags.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 500 ||
    filters.minRating > 0;

  return (
    <div className="space-y-4">
      {/* Search + filter toggle row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services by title, description, or tags..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select
          value={filters.sortBy}
          onValueChange={(v) => update({ sortBy: v })}
        >
          <SelectTrigger className="w-40 h-10 rounded-xl">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showAdvanced ? "default" : "outline"}
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-10 w-10 rounded-xl flex-shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            className="h-10 w-10 rounded-xl"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tags Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Filter by Tags
          </span>
          {filters.selectedTags.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {filters.selectedTags.length} selected
            </Badge>
          )}
        </div>

        {loadingTags ? (
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 w-20 bg-muted animate-pulse rounded-full"
              />
            ))}
          </div>
        ) : availableTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags available yet</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all duration-150 border
                  ${
                    filters.selectedTags.includes(tag)
                      ? "bg-primary text-white border-primary shadow-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  }
                `}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Tags Display */}
      {filters.selectedTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 bg-primary/5 rounded-xl">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {filters.selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update({ selectedTags: [] })}
            className="text-xs h-6 px-2"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid sm:grid-cols-2 gap-6 p-5 bg-card rounded-2xl border border-border">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">Price Range</span>
              <span className="text-muted-foreground">
                GH₵{filters.minPrice} – GH₵{filters.maxPrice}
              </span>
            </div>
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              min={0}
              max={500}
              step={5}
              onValueChange={([min, max]) =>
                update({ minPrice: min, maxPrice: max })
              }
              className="w-full"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">
                Minimum Rating
              </span>
              <span className="text-muted-foreground">
                {filters.minRating > 0 ? `${filters.minRating}+ stars` : "Any"}
              </span>
            </div>
            <Slider
              value={[filters.minRating]}
              min={0}
              max={5}
              step={0.5}
              onValueChange={([v]) => update({ minRating: v })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
