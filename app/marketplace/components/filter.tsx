"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  selectedPricing: string;
  onPricingChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  priceRange: { min: number; max: number };
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  servicesCount: number;
  totalServices: number;
}

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Booked", value: "popular" },
];

// Active filter tags stagger in as a group whenever the set changes.
const tagsContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.2 },
  },
};

export function FilterBar({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedPricing,
  onPricingChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  servicesCount,
  totalServices,
}: FilterBarProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          <motion.div whileTap={{ scale: 0.96 }}>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={onToggleFilters}
              className="rounded-xl h-11 px-4"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 px-1.5 text-[10px]"
                >
                  {servicesCount !== totalServices ? "Active" : ""}
                </Badge>
              )}
            </Button>
          </motion.div>
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                <Button
                  variant="ghost"
                  onClick={onClearFilters}
                  className="rounded-xl h-11 px-4 whitespace-nowrap"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter Panel — slides/fades open and closed instead of popping
          in and out abruptly with a plain `{showFilters && ...}` */}
      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <Card className="p-4 rounded-xl border-border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="w-full mt-1.5 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Pricing Type
                  </label>
                  <select
                    value={selectedPricing}
                    onChange={(e) => onPricingChange(e.target.value)}
                    className="w-full mt-1.5 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Pricing</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Price Range
                  </label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min || ""}
                      onChange={(e) =>
                        onPriceRangeChange({
                          ...priceRange,
                          min: Number(e.target.value) || 0,
                        })
                      }
                      className="h-10 rounded-lg"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max || ""}
                      onChange={(e) =>
                        onPriceRangeChange({
                          ...priceRange,
                          max: Number(e.target.value) || 1000,
                        })
                      }
                      className="h-10 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="w-full mt-1.5 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Tags — each tag pops in/out individually as
          filters are added or removed. */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            className="flex flex-wrap gap-2"
            initial="hidden"
            animate="visible"
            variants={tagsContainer}
          >
            {searchTerm && (
              <motion.div
                key="search-tag"
                variants={tagVariants}
                exit="exit"
                layout
              >
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => onSearchChange("")}
                  />
                </Badge>
              </motion.div>
            )}
            {selectedCategory !== "all" && (
              <motion.div
                key="category-tag"
                variants={tagVariants}
                exit="exit"
                layout
              >
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => onCategoryChange("all")}
                  />
                </Badge>
              </motion.div>
            )}
            {selectedPricing !== "all" && (
              <motion.div
                key="pricing-tag"
                variants={tagVariants}
                exit="exit"
                layout
              >
                <Badge variant="secondary" className="gap-1">
                  {selectedPricing}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => onPricingChange("all")}
                  />
                </Badge>
              </motion.div>
            )}
            {(priceRange.min > 0 || priceRange.max < 1000) && (
              <motion.div
                key="price-range-tag"
                variants={tagVariants}
                exit="exit"
                layout
              >
                <Badge variant="secondary" className="gap-1">
                  GH₵{priceRange.min} - GH₵{priceRange.max}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => onPriceRangeChange({ min: 0, max: 1000 })}
                  />
                </Badge>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
