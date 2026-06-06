"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// 1. Define types matching your BrowsePage data payload structure
interface ServiceProvider {
  full_name: string;
  avatar_url: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number | string;
  images: string[];
  avg_rating?: string | number;
  total_bookings?: number;
  profiles?: ServiceProvider | null;
  is_saved?: boolean;
}

interface ServiceGridProps {
  services: Service[];
  loading: boolean;
  onSaveToggle: (serviceId: string, saved: boolean) => void;
  emptyMessage?: string;
}

// 2. Main ServiceGrid Component
export default function ServiceGrid({
  services,
  loading,
  onSaveToggle,
  emptyMessage = "No services found.",
}: ServiceGridProps) {
  // Skeleton Loader modified to track 3 items across large display screens
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

  // Empty State Layout
  if (services.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-card">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onSaveToggle={onSaveToggle}
        />
      ))}
    </div>
  );
}

// 3. Child ServiceCard Component
function ServiceCard({
  service,
  onSaveToggle,
}: {
  service: Service;
  onSaveToggle: (serviceId: string, saved: boolean) => void;
}) {
  const displayPrice =
    typeof service.price === "number"
      ? service.price.toFixed(2)
      : parseFloat(service.price || "0").toFixed(2);

  // Default fallback image if none are uploaded
  const thumbnail =
    service.images && service.images.length > 0
      ? service.images[0]
      : "/images/placeholder-service.jpg";

  // Default avatar image fallback
  const avatarFallback =
    "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
    (service.profiles?.full_name || "UCC");

  const detailsUrl = `/student/browse/${service.id}`;

  return (
    <div className="bg-card text-card-foreground border border-muted rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full relative">
      {/* Service Thumbnail & Save Button */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={service.title}
          className="object-cover w-full h-full"
          loading="lazy"
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
      </div>

      {/* Card Content Layout */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        {/* Simple non-clickable informational wrapper block */}
        <div className="space-y-1.5 flex-grow">
          {/* Category Tag */}
          <span className="text-xs font-semibold tracking-wider text-primary uppercase">
            {service.category}
          </span>

          {/* Title */}
          <h3 className="font-bold text-base leading-tight text-foreground line-clamp-1 mt-0.5">
            {service.title}
          </h3>

          {/* Truncated Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
            {service.description}
          </p>
        </div>

        {/* Divider line */}
        <hr className="border-muted my-1" />

        {/* Peer Provider Info & Dynamic Pricing */}
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

          <div className="text-right">
            <span className="text-sm font-black text-foreground">
              GH₵{displayPrice}
            </span>
          </div>
        </div>

        {/* Dynamic Dual Interactive Action Buttons Split Layout */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            href={detailsUrl}
            className="block text-center w-full bg-secondary text-secondary-foreground border border-muted text-xs font-semibold py-2 px-3 rounded-lg hover:bg-secondary/80 transition shadow-sm active:scale-[0.98]"
          >
            View Details
          </Link>
          <Link
            href={`/marketplace/bookings/new?serviceId=${service.id}`}
            className="block text-center w-full bg-primary text-primary-foreground text-xs font-semibold py-2 px-3 rounded-lg hover:bg-primary/90 transition shadow-sm active:scale-[0.98]"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
