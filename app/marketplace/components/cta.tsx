"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface MarketplaceCTAProps {
  user: any;
}

const containerVariants = {
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
};

export function MarketplaceCTA({ user }: MarketplaceCTAProps) {
  return (
    <section className="border-t border-border/60 bg-gradient-to-b from-background to-muted/30">
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={containerVariants}
      >
        <div className="max-w-2xl mx-auto">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Ready to connect?
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="text-2xl md:text-3xl font-bold text-foreground mb-3"
          >
            Find the perfect service for your needs
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground text-sm md:text-base leading-relaxed"
          >
            Browse through our verified UCC student services.
            <span className="font-semibold text-primary">
              {" "}
              Login to your dashboard
            </span>{" "}
            to book a service, chat with providers, and manage all your bookings
            in one place.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6"
          >
            <Button asChild className="rounded-xl px-8 gap-2">
              <Link href={user ? "/student/dashboard" : "/login"}>
                {user ? "Go to Dashboard" : "Login to Book"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            {!user && (
              <Button variant="outline" asChild className="rounded-xl px-8">
                <Link href="/register">Create Account</Link>
              </Button>
            )}
          </motion.div>
          {!user && (
            <motion.p
              variants={itemVariants}
              className="text-xs text-muted-foreground mt-4"
            >
              Register with your UCC email to get started
            </motion.p>
          )}
        </div>
      </motion.div>
    </section>
  );
}
