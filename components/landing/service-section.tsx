"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  Palette,
  Code,
  BookOpen,
  Camera,
  PenTool,
  Music,
  Dumbbell,
  Utensils,
  ArrowRight,
} from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  tags: string[];
  status: string;
  avg_rating: number | null;
  total_reviews: number | null;
  pricing_type: string | null;
  created_at: string;
  provider_id: string;
}

const headerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};
const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 bg-muted rounded-full animate-pulse w-14" />
          <div className="h-5 bg-muted rounded-full animate-pulse w-14" />
        </div>
        <div className="h-5 bg-muted rounded animate-pulse w-24 pt-2 border-t border-border/50" />
      </div>
    </Card>
  );
}

function getPriceDisplay(price: number, pricingType: string | null): string {
  if (!Number.isFinite(price)) return "Contact for price";
  const formatted = `GH₵${price.toFixed(2)}`;
  if (pricingType === "hourly") return `${formatted}/hr`;
  if (pricingType === "negotiable") return `From ${formatted}`;
  return formatted;
}

function getPricingIcon(pricingType: string | null) {
  if (pricingType === "hourly") return Clock;
  if (pricingType === "negotiable") return TrendingUp;
  return DollarSign;
}

export function ServiceGridSection() {
  // null = loading, [] = done empty, [...] = done with data
  const [services, setServices] = useState<Service[] | null>(null);

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from("services")
      .select(
        `
      id,
      title,
      description,
      category,
      price,
      images,
      tags,
      status,
      avg_rating,
      total_reviews,
      pricing_type,
      created_at,
      provider_id
      `,
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("[Services] fetch error:", error.message);
      setServices([]);
      return;
    }

    setServices(data ?? []);
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchServices();

    // Listen for changes to the services table
    const channel = supabase
      .channel("featured-services")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "services",
        },
        (payload) => {
          console.log("Service updated:", payload);
          fetchServices();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchServices]);

  const isLoading = services === null;

  const SectionShell = ({ children }: { children: React.ReactNode }) => (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );

  const SectionHeader = ({ animated = false }: { animated?: boolean }) => {
    const Wrapper = animated ? motion.div : "div";
    return (
      <Wrapper
        className="text-center mb-12"
        {...(animated
          ? {
              initial: "hidden",
              whileInView: "visible",
              viewport: { once: true, amount: 0.4 },
              variants: headerContainer,
            }
          : {})}
      >
        {animated ? (
          <>
            <motion.div variants={itemVariants}>
              <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
                Marketplace
              </Badge>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-2xl lg:text-3xl font-heading mb-4 tracking-tight"
            >
              Featured Services
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-muted-foreground font-body"
            >
              Discover services offered by UCC students
            </motion.p>
          </>
        ) : (
          <>
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              Marketplace
            </Badge>
            <h2 className="text-2xl lg:text-3xl font-heading mb-4 tracking-tight">
              Featured Services
            </h2>
            <p className="text-muted-foreground font-body">
              Discover services offered by UCC students
            </p>
          </>
        )}
      </Wrapper>
    );
  };

  if (isLoading) {
    return (
      <SectionShell>
        <SectionHeader />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </SectionShell>
    );
  }

  if (services.length === 0) {
    return (
      <SectionShell>
        <SectionHeader />
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">No services available yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Check back later for new services
          </p>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <SectionHeader animated />

      <motion.div
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={gridContainer}
      >
        {services.map((service) => {
          const PriceIcon = getPricingIcon(service.pricing_type);
          const priceDisplay = getPriceDisplay(
            service.price,
            service.pricing_type,
          );

          // avg_rating comes from the DB as a number or null — parse cleanly
          const avgRating =
            service.avg_rating != null ? Number(service.avg_rating) : null;
          const totalReviews = service.total_reviews ?? 0;
          const hasRating =
            avgRating !== null && avgRating > 0 && totalReviews > 0;

          const imageUrl =
            service.images?.[0] || "/images/placeholder-service.jpg";

          return (
            <motion.div key={service.id} variants={itemVariants}>
              <Link href={`/marketplace/${service.id}`} className="block group">
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full">
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <Image
                        src={imageUrl}
                        alt={service.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Pricing type pill */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-sm text-white capitalize">
                          <PriceIcon className="w-3 h-3" />
                          {service.pricing_type || "fixed"}
                        </span>
                      </div>

                      {/* Rating pill — only shown when real data exists */}
                      {hasRating && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-white">
                            {avgRating!.toFixed(1)}
                          </span>
                          <span className="text-xs text-white/70">
                            ({totalReviews})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                          {service.category}
                        </span>
                        <h3 className="font-semibold text-foreground text-lg mt-1 group-hover:text-primary transition-colors line-clamp-1">
                          {service.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {service.description}
                        </p>
                      </div>

                      {/* Tags */}
                      {service.tags && service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {service.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {service.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{service.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-lg font-bold text-primary">
                          {priceDisplay}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="text-center mt-10">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Browse All Services
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </SectionShell>
  );
}
