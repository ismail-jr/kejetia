"use client";

import { useState } from "react";
import { Heart, Clock, DollarSign, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import BookingModal from "../booking/booking-modal";
import { useAuth } from "@/contexts/auth-context";
import { isOwnService } from "@/lib/utils/booking";

interface ServiceProvider {
  full_name: string;
  avatar_url: string;
}

type PricingType = "fixed" | "hourly" | "negotiable";

interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category: string;
  price: number | string;
  pricing_type?: PricingType;
  images: string[];
  tags?: string[];
  avg_rating?: string | number;
  total_bookings?: number;
  total_reviews?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: ServiceProvider | null;
  is_saved?: boolean;
}

interface ServiceGridProps {
  services: Service[];
  loading: boolean;
  onSaveToggle: (serviceId: string, saved: boolean) => void;
  emptyMessage?: string;
}

export default function ServiceGrid({
  services,
  loading,
  onSaveToggle,
  emptyMessage = "No services found.",
}: ServiceGridProps) {
  const [activeBookingService, setActiveBookingService] =
    useState<Service | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border border-muted rounded-xl p-4 space-y-4 animate-pulse"
          >
            <div className="bg-muted aspect-video w-full rounded-lg" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-9 bg-muted rounded w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-card">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onSaveToggle={onSaveToggle}
            onBookClick={(targetService) =>
              setActiveBookingService(targetService)
            }
          />
        ))}
      </div>

      {activeBookingService && (
        <BookingModal
          isOpen={!!activeBookingService}
          onClose={() => setActiveBookingService(null)}
          serviceId={activeBookingService.id}
          serviceTitle={activeBookingService.title}
          providerId={activeBookingService.provider_id}
          servicePrice={
            typeof activeBookingService.price === "number"
              ? activeBookingService.price
              : parseFloat(activeBookingService.price || "0")
          }
        />
      )}
    </>
  );
}

function ServiceCard({
  service,
  onSaveToggle,
  onBookClick,
}: {
  service: Service;
  onSaveToggle: (serviceId: string, saved: boolean) => void;
  onBookClick: (service: Service) => void;
}) {
  const { user } = useAuth();
  const isOwner = isOwnService(user?.id, service.provider_id);
  const getPriceDisplay = () => {
    const price =
      typeof service.price === "number"
        ? service.price
        : parseFloat(service.price || "0");
    const pricingType = service.pricing_type || "fixed";

    switch (pricingType) {
      case "hourly":
        return {
          label: `GH₵${price.toFixed(2)}/hour`,
          icon: Clock,
          suffix: "per hour",
        };
      case "negotiable":
        return {
          label: `From GH₵${price.toFixed(2)}`,
          icon: TrendingUp,
          suffix: "negotiable",
        };
      case "fixed":
      default:
        return {
          label: `GH₵${price.toFixed(2)}`,
          icon: DollarSign,
          suffix: "fixed price",
        };
    }
  };

  const priceDisplay = getPriceDisplay();
  const PriceIcon = priceDisplay.icon;

  const thumbnail =
    service.images && service.images.length > 0
      ? service.images[0]
      : "/images/placeholder-service.jpg";

  const avatarFallback =
    "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
    (service.profiles?.full_name || "UCC");

  const detailsUrl = `/student/browse/${service.id}`;
  const pricingType = service.pricing_type || "fixed";

  // Parse rating and review count
  const rating = service.avg_rating
    ? parseFloat(String(service.avg_rating))
    : 0;
  const hasRating = rating > 0;
  const reviewCount = Number(service.total_reviews || 0);

  // Determine rating label
  const getRatingLabel = () => {
    if (!hasRating) return "No reviews yet";
    if (rating >= 4.5) return "Outstanding";
    if (rating >= 4.0) return "Great";
    if (rating >= 3.0) return "Good";
    if (rating >= 2.0) return "Average";
    return "Poor";
  };

  return (
    <div className="bg-card text-card-foreground border border-muted rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full relative">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={service.title}
          className="object-cover w-full h-full"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/images/placeholder-service.jpg";
          }}
        />

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSaveToggle(service.id, !service.is_saved);
          }}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm shadow-sm text-muted-foreground hover:text-destructive hover:bg-background transition"
          aria-label={service.is_saved ? "Unsave service" : "Save service"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              service.is_saved ? "fill-destructive text-destructive" : ""
            }`}
          />
        </button>

        <div className="absolute bottom-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
            <PriceIcon className="w-3 h-3" />
            <span className="capitalize">{pricingType}</span>
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <div className="space-y-1.5 flex-grow">
          <span className="text-xs font-semibold tracking-wider text-primary uppercase">
            {service.category}
          </span>
          <h3 className="font-bold text-base leading-tight text-foreground line-clamp-1 mt-0.5">
            {service.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
            {service.description}
          </p>
        </div>

        <hr className="border-muted my-1" />

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2 min-w-0">
            <img
              src={service.profiles?.avatar_url || avatarFallback}
              alt={service.profiles?.full_name || "Student"}
              className="w-6 h-6 rounded-full object-cover border border-muted bg-background"
            />
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]">
              {service.profiles?.full_name || "UCC Peer"}
            </span>
          </div>

          {/* Rating and Reviews Row */}
          <div className="flex items-center gap-2 text-xs">
            {hasRating ? (
              <>
                <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">
                    {rating.toFixed(1)}
                  </span>
                </div>
                {reviewCount > 0 && (
                  <span className="text-muted-foreground text-[10px]">
                    ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground/80 italic text-[11px] bg-muted/40 px-2 py-0.5 rounded-md">
                No reviews yet
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Quality Rating Tagline */}
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-medium ${!hasRating ? "text-muted-foreground/60 italic" : "text-muted-foreground"}`}
          >
            {getRatingLabel()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">
              {priceDisplay.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {priceDisplay.suffix}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            href={detailsUrl}
            className="block text-center w-full bg-secondary text-secondary-foreground border border-muted text-xs font-semibold py-2 px-3 rounded-lg hover:bg-secondary/80 transition shadow-sm active:scale-[0.98]"
          >
            View Details
          </Link>

          {isOwner ? (
            <Link
              href="/provider/services"
              className="block text-center w-full bg-secondary text-secondary-foreground border border-muted text-xs font-semibold py-2 px-3 rounded-lg hover:bg-secondary/80 transition shadow-sm active:scale-[0.98]"
            >
              Your Listing
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onBookClick(service)}
              className="block text-center w-full bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 rounded-lg hover:bg-primary/90 transition shadow-sm active:scale-[0.98]"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
