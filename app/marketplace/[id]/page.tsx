"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  MapPin,
  Phone,
  MessageSquare,
  Share2,
  CalendarDays,
  Shield,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Service {
  id: string;
  provider_id: string;
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
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    location: string;
    phone: string;
  };
}

export default function MarketplaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("services")
          .select(
            `
            *,
            profiles:provider_id (
              full_name,
              avatar_url,
              location,
              phone
            )
          `,
          )
          .eq("id", id)
          .eq("status", "approved")
          .single();

        if (error) {
          console.error("Error fetching service:", error);
          toast.error("Service not found");
          router.push("/marketplace");
          return;
        }

        setService(data);
      } catch (error) {
        console.error("Error fetching service:", error);
        toast.error("Failed to load service details");
        router.push("/marketplace");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-6 w-24 bg-muted rounded mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square bg-muted rounded-xl" />
                <div className="space-y-4">
                  <div className="h-8 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-24 bg-muted rounded" />
                  <div className="h-12 w-1/3 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Service not found
            </h2>
            <p className="text-muted-foreground mt-2">
              The service you're looking for doesn't exist.
            </p>
            <Button asChild className="mt-4 rounded-xl">
              <Link href="/marketplace">Back to Marketplace</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
    switch (pricingType) {
      case "hourly":
        return { label: "Hourly", icon: Clock };
      case "negotiable":
        return { label: "Negotiable", icon: TrendingUp };
      default:
        return { label: "Fixed", icon: DollarSign };
    }
  };

  const pricingInfo = getPricingInfo(service.pricing_type);
  const PriceIcon = pricingInfo.icon;
  const priceDisplay = getPriceDisplay(service.price, service.pricing_type);
  const rating = parseFloat(service.avg_rating);
  const hasRating = rating > 0;
  const imageUrls = service.images || [];
  const displayImage =
    imageUrls[activeImage] || "/images/placeholder-service.jpg";
  const initials =
    service.profiles?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleCall = () => {
    if (service.profiles?.phone) {
      window.location.href = `tel:${service.profiles.phone}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Images */}
            <div className="space-y-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                <Image
                  src={displayImage}
                  alt={service.title}
                  fill
                  className="object-cover"
                  priority
                />
                <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0">
                  {service.category}
                </Badge>
              </div>
              {imageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        activeImage === index
                          ? "border-primary"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4">
              {/* Title & Rating */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    {service.title}
                  </h1>
                  {hasRating && (
                    <div className="flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-lg flex-shrink-0">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-sm">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {hasRating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {rating.toFixed(1)} ({service.total_reviews} reviews)
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {service.total_bookings} bookings
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  Verified
                </span>
              </div>

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Provider Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={service.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {service.profiles?.full_name || "UCC Student"}
                  </p>
                  {service.profiles?.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {service.profiles.location}
                      </span>
                    </div>
                  )}
                </div>
                {service.profiles?.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-1.5 flex-shrink-0"
                    onClick={handleCall}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Call</span>
                  </Button>
                )}
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-2 pt-2 border-t border-border/50">
                <span className="text-2xl font-bold text-primary">
                  {priceDisplay}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <PriceIcon className="w-3 h-3" />
                  {pricingInfo.label}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="rounded-xl flex-1 gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message Provider
                </Button>
                <Button variant="outline" className="rounded-xl px-4 gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>

              {/* Provider Phone - Mobile only */}
              {service.profiles?.phone && (
                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-xl border border-primary/10 md:hidden">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Call provider:
                  </span>
                  <a
                    href={`tel:${service.profiles.phone}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {service.profiles.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
