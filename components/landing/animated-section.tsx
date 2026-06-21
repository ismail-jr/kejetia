"use client";

import { motion, type Variants } from "framer-motion";
import * as React from "react";

/**
 * Wraps a landing-page section so it scales + fades in as it scrolls into
 * view, with its direct children staggering in one after another.
 *
 * Usage:
 *   <AnimatedSection>
 *     <HeroSection ... />
 *   </AnimatedSection>
 *
 * For staggered children *within* a section (e.g. a row of feature cards),
 * wrap each card in <AnimatedItem> instead, nested inside an <AnimatedSection>.
 */

const sectionVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1], // snappy "punch in" ease
      staggerChildren: 0.25,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Lower = triggers earlier while scrolling. 0.2 = 20% visible. */
  amount?: number;
}

export function AnimatedSection({
  children,
  className,
  amount = 0.2,
}: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={sectionVariants}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Use inside an AnimatedSection to make a child pop in as part of the
 * parent's stagger sequence (e.g. each card in a feature grid).
 */
export function AnimatedItem({ children, className }: AnimatedItemProps) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
