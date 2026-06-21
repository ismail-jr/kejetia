"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, CheckCircle, Star, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        // Fetch all reviews to calculate average
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

  // Format rating display
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div className="max-w-2xl">
          <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
            <Shield className="font-heading w-3.5 h-3.5 mr-1.5" />
            Exclusively for UCC Students
          </Badge>
          <h1 className="text-5xl lg:text-7xl font-heading mb-6 leading-tight tracking-tight">
            Skills & Services,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              Campus to Campus
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg font-body">
            Kejetia is the verified peer-to-peer marketplace where University of
            Cape Coast students offer and discover services from tutoring to
            design, all within your campus community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
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
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-muted-foreground">
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
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce hidden sm:block">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
