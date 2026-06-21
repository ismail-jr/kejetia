"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, CheckCircle, Star, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface HeroSectionProps {
  onGetStarted: () => void;
}

// Parent container — staggers each direct motion child in sequence.
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.25,
      delayChildren: 0.2,
    },
  },
};

// Each piece (badge, heading, paragraph, buttons, trust row) scales + pops in.
const itemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data: reviews, error } = await supabase
          .from("reviews")
          .select("rating");

        if (error) {
          console.error("Error fetching reviews for rating:", error);
          setLoading(false);
          return;
        }

        if (!reviews || reviews.length === 0) {
          setAvgRating(null);
          setTotalReviews(0);
          setLoading(false);
          return;
        }

        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        const average = total / reviews.length;
        setAvgRating(average);
        setTotalReviews(reviews.length);
      } catch (error) {
        console.error("Error fetching rating:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, []);

  const displayRating = loading
    ? "4.8"
    : avgRating !== null
      ? avgRating.toFixed(1)
      : "4.8";
  const displayReviews = loading ? 0 : totalReviews;

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          <Image
            src="/images/hero.jpg"
            alt="UCC Campus"
            fill
            className="object-cover"
            priority
            onError={(e) => {
              const target = e.target as HTMLElement;
              target.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
        </div>
      </div>

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-2xl">
          <motion.div variants={itemVariants}>
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              <Shield className="font-heading w-3.5 h-3.5 mr-1.5" />
              Exclusively for UCC Students
            </Badge>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-7xl font-heading mb-4 sm:mb-6 leading-tight tracking-tight"
          >
            Skills & Services,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              Campus to Campus
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed max-w-lg font-body"
          >
            Kejetia is the verified peer-to-peer marketplace where University of
            Cape Coast students offer and discover services from tutoring to
            design, all within your campus community.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            >
              Start Exploring
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 border-border bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted"
              asChild
            >
              <Link href="/login">
                Offer a Service
                <Sparkles className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 sm:mt-10 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" /> UCC email
              required
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" /> Safe & Verified
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-warning fill-warning" />
              {loading ? (
                <span>Loading...</span>
              ) : avgRating !== null ? (
                <span>
                  Rated {displayRating}/5 ({totalReviews} reviews)
                </span>
              ) : (
                <span>Be the first to review</span>
              )}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce hidden sm:block">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
