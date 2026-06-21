"use client";

import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";

interface CTASectionProps {
  onGetStarted: () => void;
}

export function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-y border-border/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-heading mb-4 tracking-tight">
          Ready to Kejetia?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto font-body">
          Join hundreds of UCC students already using UCC Connect to learn,
          earn, and grow together.
        </p>
        <Button
          size="lg"
          onClick={onGetStarted}
          className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
        >
          Get Started Free
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}
