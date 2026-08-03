"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";

interface CTASectionProps {
  onGetStarted: () => void;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-y border-border/40">
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
        </motion.div>
        <motion.h2
          variants={itemVariants}
          className="text-3xl font-heading mb-4 tracking-tight"
        >
          Ready to Kejetia?
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="text-muted-foreground mb-8 max-w-xl mx-auto font-body"
        >
          Join hundreds of UCC students already using Kejetia to learn,
          earn, and grow together.
        </motion.p>
        <motion.div variants={itemVariants}>
          <Button
            size="lg"
            onClick={onGetStarted}
            className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
