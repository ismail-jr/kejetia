"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, DollarSign, TrendingUp } from "lucide-react";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: string;
    images: string[];
    tags: string[];
    avg_rating: string;
    total_reviews: number;
    total_bookings: number;
    pricing_type: string;
    profiles?: {
      full_name: string;
      avatar_url: string;
      location: string;
    };
  };
}

const PRICING_TYPE_MAP = {
  fixed: { label: "Fixed", icon: DollarSign },
  hourly: { label: "Hourly", icon: Clock },
  negotiable: { label: "Negotiable", icon: TrendingUp },
};

export function ServiceCard({ service }: ServiceCardProps) {
  const getPriceDisplay = (price: string, pricingType: string) => {
    const formattedPrice = parseFloat(price).toFixed(2);
    switch (pricingType) {
      case "hourly":
        return `GH₵${formattedPrice}/hr`;
      case "negotiable":
        return `From GH₵${formattedPrice}`;
      default:
        return `GH₵${formattedPrice}`;
    }
  };

  const getPricingInfo = (pricingType: string) => {
    return (
      PRICING_TYPE_MAP[pricingType as keyof typeof PRICING_TYPE_MAP] ||
      PRICING_TYPE_MAP.fixed
    );
  };

  const pricingInfo = getPricingInfo(service.pricing_type);
  const PriceIcon = pricingInfo.icon;
  const priceDisplay = getPriceDisplay(service.price, service.pricing_type);
  const rating = parseFloat(service.avg_rating);
  const hasRating = rating > 0;
  const imageUrl = service.images?.[0] || "/images/placeholder-service.jpg";
  const initials =
    service.profiles?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col h-full">
        {/* Image */}
        <Link
          href={`/marketplace/${service.id}`}
          className="block relative h-48 w-full overflow-hidden bg-muted"
        >
          <Image
            src={imageUrl}
            alt={service.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <Badge
              variant="secondary"
              className="bg-black/60 backdrop-blur-sm text-white border-0"
            >
              <PriceIcon className="w-3 h-3 mr-1" />
              {pricingInfo.label}
            </Badge>
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
        </Link>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col space-y-3">
          <div>
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              {service.category}
            </span>
            <Link href={`/marketplace/${service.id}`}>
              <h3 className="font-semibold text-foreground text-base mt-1 hover:text-primary transition-colors line-clamp-1">
                {service.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {service.description}
            </p>
          </div>

          {/* Provider Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="w-5 h-5">
              <AvatarImage src={service.profiles?.avatar_url} />
              <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate">
              {service.profiles?.full_name || "UCC Student"}
            </span>
            {service.profiles?.location && (
              <>
                <span>•</span>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{service.profiles.location}</span>
              </>
            )}
          </div>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {service.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {service.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{service.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
            <div>
              <span className="text-lg font-bold text-primary">
                {priceDisplay}
              </span>
            </div>
            <Button asChild size="sm" className="rounded-xl">
              <Link href={`/marketplace/${service.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
