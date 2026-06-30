"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  CalendarCheck,
  MapPin,
  Phone,
  ChevronRight,
  DollarSign,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ServiceSidebarProps {
  serviceId: string;
  providerId: string;
  isOwner: boolean;
  authLoading: boolean;
  onBookingClick: () => void;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
    location: string | null;
    phone: string | null;
  };
  priceDisplay: string;
  priceLabel: string;
  pricingType: string | null;
  tags?: string[];
}

export function ServiceSidebar({
  serviceId,
  providerId,
  isOwner,
  authLoading,
  onBookingClick,
  profiles,
  priceDisplay,
  priceLabel,
  pricingType,
  tags = [],
}: ServiceSidebarProps) {
  const initials =
    profiles?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const getPricingIcon = (type: string | null) => {
    switch (type) {
      case "hourly":
        return Clock;
      case "negotiable":
        return TrendingUp;
      default:
        return DollarSign;
    }
  };

  const PriceIcon = getPricingIcon(pricingType);

  return (
    <div className="space-y-4 md:sticky md:top-24 md:self-start">
      {/* Price Card */}
      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Price
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {priceDisplay}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <PriceIcon className="w-3 h-3" />
            {priceLabel}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {pricingType === "hourly" && "Charged per hour of service"}
          {pricingType === "negotiable" &&
            "Price can be discussed with provider"}
          {pricingType === "fixed" && "One-time fixed payment"}
        </p>
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-xl space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isOwner ? (
        <Button asChild className="w-full rounded-xl gap-2 h-12">
          <Link href={`/provider/dashboard/services/${serviceId}/edit`}>
            <Pencil className="w-4 h-4" />
            Edit Listing
          </Link>
        </Button>
      ) : (
        <Button
          className="w-full rounded-xl gap-2 h-12"
          onClick={onBookingClick}
          disabled={authLoading}
        >
          <CalendarCheck className="w-4 h-4" />
          Book Now
        </Button>
      )}

      {/* Provider Card */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {profiles?.full_name || "UCC Student"}
            </p>
            {profiles?.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{profiles.location}</span>
              </div>
            )}
            {profiles?.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Phone className="w-3 h-3" />
                <span className="truncate">{profiles.phone}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          asChild
          className="w-full rounded-xl gap-1.5 justify-between"
        >
          <Link
            href={`/providers/${providerId}`}
            target="_blank"
            rel="noreferrer"
          >
            View Provider Profile
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
