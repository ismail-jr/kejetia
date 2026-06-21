"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { ServiceCard } from "./service-card";

interface ServicesGridProps {
  services: any[];
  loading: boolean;
  onClearFilters: () => void;
}

const gridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function ServicesGrid({
  services,
  loading,
  onClearFilters,
}: ServicesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={emptyStateVariants}
        className="text-center py-16 bg-card rounded-2xl border border-border"
      >
        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">
          No services found
        </h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
        <Button
          variant="outline"
          className="mt-4 rounded-xl"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
      </motion.div>
    );
  }

  // Keying the whole grid on the visible set of service IDs means that
  // whenever a filter/search/sort change swaps out *which* services are
  // shown, AnimatePresence treats it as a fresh mount and the stagger
  // entrance replays — so every filter interaction feels alive instead of
  // the grid just silently swapping content in place.
  const gridKey = services.map((s) => s.id).join("-");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gridKey}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={gridContainer}
      >
        {services.map((service) => (
          <motion.div key={service.id} variants={itemVariants}>
            <ServiceCard service={service} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
