// B:\Projects\kejetia\components\profile\provider-preview.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Phone,
  Calendar,
  Briefcase,
  Shield,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface ProviderProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
}

interface ProviderService {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  pricing_type: string;
  images: string[];
  avg_rating: string;
  total_reviews: number;
  total_bookings: number;
}

const PRICING_TYPE_MAP: Record<string, { label: string; icon: any }> = {
  fixed: { label: "Fixed", icon: DollarSign },
  hourly: { label: "Hourly", icon: Clock },
  negotiable: { label: "Negotiable", icon: TrendingUp },
};

const headerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

interface ProviderPreviewProps {
  providerId: string;
  onBack?: () => void;
}

export function ProviderPreview({ providerId, onBack }: ProviderPreviewProps) {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [aggregateRating, setAggregateRating] = useState<number | null>(null);
  const [totalReviewCount, setTotalReviewCount] = useState(0);
  const [totalBookingCount, setTotalBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviderData = async () => {
      if (!providerId) {
        console.log("No provider ID provided");
        setLoading(false);
        return;
      }

      try {
        // Step 1: provider's own profile row. Looked up by user_id.
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, user_id, full_name, avatar_url, location, phone, bio, created_at",
          )
          .eq("user_id", providerId)
          .single();

        if (profileError || !profileData) {
          console.error("Error fetching provider profile:", profileError);

          // Try fallback: check if providerId matches profiles.id instead
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("profiles")
            .select(
              "id, user_id, full_name, avatar_url, location, phone, bio, created_at",
            )
            .eq("id", providerId)
            .single();

          if (fallbackError || !fallbackData) {
            toast.error("Provider not found");
            setLoading(false);
            return;
          }

          setProvider(fallbackData);

          // Fetch services with the found provider's user_id
          const providerUserId = fallbackData.user_id;
          await fetchServices(providerUserId);
          setLoading(false);
          return;
        }

        setProvider(profileData);
        await fetchServices(providerId);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching provider data:", error);
        toast.error("Failed to load provider profile");
        setLoading(false);
      }
    };

    const fetchServices = async (providerId: string) => {
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select(
            "id, title, description, category, price, pricing_type, images, avg_rating, total_reviews, total_bookings",
          )
          .eq("provider_id", providerId)
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (servicesError) {
          console.error("Error fetching provider services:", servicesError);
          return;
        }

        const providerServices = servicesData || [];
        setServices(providerServices);

        const bookingSum = providerServices.reduce(
          (sum, s) => sum + (s.total_bookings || 0),
          0,
        );
        setTotalBookingCount(bookingSum);

        // Aggregate rating across all reviews
        const serviceIds = providerServices.map((s) => s.id);

        if (serviceIds.length > 0) {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from("reviews")
            .select("rating")
            .in("service_id", serviceIds);

          if (reviewsError) {
            console.error("Error fetching provider reviews:", reviewsError);
          } else if (reviewsData && reviewsData.length > 0) {
            const total = reviewsData.reduce((sum, r) => sum + r.rating, 0);
            setAggregateRating(total / reviewsData.length);
            setTotalReviewCount(reviewsData.length);
          }
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchProviderData();
  }, [providerId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="h-4 w-28 bg-muted rounded" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground">
          Provider not found
        </h2>
        <p className="text-muted-foreground mt-2">
          This provider profile doesn't exist or is unavailable.
        </p>
        <Button asChild className="mt-4 rounded-xl">
          <Link href="/marketplace">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const initials =
    provider.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const memberSince = new Date(provider.created_at).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const getPriceDisplay = (price: string, pricingType: string) => {
    const formatted = parseFloat(price).toFixed(2);
    switch (pricingType) {
      case "hourly":
        return `GH₵${formatted}/hr`;
      case "negotiable":
        return `From GH₵${formatted}`;
      default:
        return `GH₵${formatted}`;
    }
  };

  return (
    <div>
      {/* Provider header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={headerContainer}
        className="mb-10"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-start gap-5"
        >
          <Avatar className="w-20 h-20 border-2 border-primary/10 flex-shrink-0">
            <AvatarImage src={provider.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">
                {provider.full_name || "UCC Student"}
              </h1>
              <Badge
                variant="secondary"
                className="gap-1 bg-green-500/10 text-green-600 border-0"
              >
                <Shield className="w-3 h-3" />
                Verified
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
              {provider.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {provider.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {memberSince}
              </span>
              {provider.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {provider.phone}
                </span>
              )}
            </div>

            {provider.bio && (
              <p className="text-sm text-foreground/90 leading-relaxed max-w-2xl">
                {provider.bio}
              </p>
            )}
          </div>
        </motion.div>

        {/* Aggregate stats row */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-3 mt-6 max-w-md"
        >
          <div className="text-center p-3 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
              {aggregateRating !== null ? (
                <>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {aggregateRating.toFixed(1)}
                </>
              ) : (
                "—"
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalReviewCount > 0
                ? `${totalReviewCount} review${totalReviewCount !== 1 ? "s" : ""}`
                : "No reviews yet"}
            </p>
          </div>
          <div className="text-center p-3 bg-card border border-border rounded-xl">
            <div className="text-lg font-bold text-foreground">
              {totalBookingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Bookings</p>
          </div>
          <div className="text-center p-3 bg-card border border-border rounded-xl">
            <div className="text-lg font-bold text-foreground">
              {services.length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active listing{services.length !== 1 ? "s" : ""}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Services grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Services Offered
        </h2>

        {services.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground">
              No active listings right now
            </p>
          </div>
        ) : (
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={gridContainer}
          >
            {services.map((service) => {
              const pricingInfo =
                PRICING_TYPE_MAP[service.pricing_type] ||
                PRICING_TYPE_MAP.fixed;
              const PriceIcon = pricingInfo.icon;
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
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                      <div className="relative h-36 w-full overflow-hidden bg-muted">
                        <Image
                          src={imageUrl}
                          alt={service.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {hasRating && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium text-white">
                              {rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                          {service.category}
                        </span>
                        <h3 className="font-semibold text-sm text-foreground mt-0.5 group-hover:text-primary transition-colors line-clamp-1">
                          {service.title}
                        </h3>
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <span className="text-sm font-bold text-primary">
                            {getPriceDisplay(
                              service.price,
                              service.pricing_type,
                            )}
                          </span>
                          <PriceIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
