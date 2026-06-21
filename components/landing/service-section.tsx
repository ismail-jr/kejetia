"use client";

import { useEffect, useState } from "react";
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
  price: string;
  images: string[];
  tags: string[];
  status: string;
  avg_rating: string;
  total_reviews: number;
  total_bookings: number;
  pricing_type: string;
  created_at: string;
  provider_id: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  "design & creative": Palette,
  design: Palette,
  programming: Code,
  tutoring: BookOpen,
  photography: Camera,
  writing: PenTool,
  music: Music,
  fitness: Dumbbell,
  cooking: Utensils,
};

// Header (badge + heading + paragraph) staggers in as one group.
const headerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

// Service cards stagger in as their own group, once in view.
const gridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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

export function ServiceGridSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) {
          console.error("Error fetching services:", error);
          setLoading(false);
          return;
        }

        setServices(data || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getPriceDisplay = (price: string, pricingType: string) => {
    const formattedPrice = parseFloat(price).toFixed(2);
    switch (pricingType) {
      case "hourly":
        return `GH₵${formattedPrice}/hour`;
      case "negotiable":
        return `From GH₵${formattedPrice}`;
      default:
        return `GH₵${formattedPrice}`;
    }
  };

  const getPricingIcon = (pricingType: string) => {
    switch (pricingType) {
      case "hourly":
        return Clock;
      case "negotiable":
        return TrendingUp;
      default:
        return DollarSign;
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-heading mb-4 tracking-tight">
              Featured Services
            </h2>
            <p className="text-muted-foreground font-body">
              Discover services offered by UCC students
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-heading mb-4 tracking-tight">
              Featured Services
            </h2>
            <p className="text-muted-foreground font-body">
              Discover services offered by UCC students
            </p>
          </div>
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground">No services available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for new services
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={headerContainer}
        >
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
        </motion.div>

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
            const rating = parseFloat(service.avg_rating);
            const hasRating = rating > 0;
            const imageUrl =
              service.images?.[0] || "/images/placeholder-service.jpg";

            return (
              <motion.div key={service.id} variants={itemVariants}>
                <Link
                  href={`/marketplace/${service.id}`}
                  className="block group"
                >
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
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-sm text-white">
                            <PriceIcon className="w-3 h-3" />
                            {service.pricing_type || "fixed"}
                          </span>
                        </div>
                        {hasRating && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium text-white">
                              {rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-white/60">
                              ({service.total_reviews})
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
      </div>
    </section>
  );
}
