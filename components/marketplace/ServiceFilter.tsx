'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = ['all', 'tutoring', 'design', 'programming', 'photography', 'writing', 'music', 'fitness', 'cooking', 'other'];

export interface ServiceFilters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  sortBy: string;
  minRating: number;
}

interface ServiceFilterProps {
  filters: ServiceFilters;
  onChange: (filters: ServiceFilters) => void;
}

export default function ServiceFilter({ filters, onChange }: ServiceFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (partial: Partial<ServiceFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const resetFilters = () => {
    onChange({
      search: '',
      category: 'all',
      minPrice: 0,
      maxPrice: 500,
      sortBy: 'newest',
      minRating: 0,
    });
  };

  const hasActiveFilters = filters.category !== 'all' || filters.minPrice > 0 || filters.maxPrice < 500 || filters.minRating > 0;

  return (
    <div className="space-y-4">
      {/* Search + filter toggle row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select value={filters.sortBy} onValueChange={(v) => update({ sortBy: v })}>
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
          variant={showAdvanced ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-10 w-10 rounded-xl flex-shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={resetFilters} className="h-10 w-10 rounded-xl">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => update({ category: cat })}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all duration-150 border
              ${filters.category === cat
                ? 'bg-primary text-white border-primary shadow-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }
            `}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid sm:grid-cols-2 gap-6 p-5 bg-card rounded-2xl border border-border">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">Price Range</span>
              <span className="text-muted-foreground">GH₵{filters.minPrice} – GH₵{filters.maxPrice}</span>
            </div>
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              min={0}
              max={500}
              step={5}
              onValueChange={([min, max]) => update({ minPrice: min, maxPrice: max })}
              className="w-full"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">Minimum Rating</span>
              <span className="text-muted-foreground">{filters.minRating > 0 ? `${filters.minRating}+ stars` : 'Any'}</span>
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
