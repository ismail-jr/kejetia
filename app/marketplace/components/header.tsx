"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MarketplaceHeaderProps {
  count: number;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function MarketplaceHeader({ count }: MarketplaceHeaderProps) {
  return (
    <motion.div
      className="mb-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-foreground">
            Browse Services
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover services offered by UCC students
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          {/* AnimatePresence + key=count lets the count "pop" each time the
              filtered number changes, giving feedback that filtering worked. */}
          <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                initial={{ opacity: 0, y: -6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="font-medium text-foreground tabular-nums"
              >
                {count}
              </motion.span>
            </AnimatePresence>
            service{count !== 1 ? "s" : ""} found
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
