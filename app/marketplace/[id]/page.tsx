"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import BookingModal from "@/components/booking/booking-modal";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ServiceDetails } from "../components/service-details";
import { ServiceSidebar } from "../components/service-sidebar";
import { ServiceImages } from "../components/service-images-details";

interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  tags: string[];
  status: string;
  avg_rating: number;
  total_reviews: number;
  total_bookings: number;
  pricing_type: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
    location: string | null;
    phone: string | null;
  };
}

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("services")
          .select(
            `*, profiles:provider_id (full_name, avatar_url, location, phone)`,
          )
          .eq("id", id)
          .eq("status", "approved")
          .single();

        if (error) {
          toast.error("Service not found");
          router.push("/marketplace");
          return;
        }
        setService(data);
      } catch (error) {
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
          <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
            <div className="h-6 w-24 bg-muted rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-square bg-muted rounded-xl" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
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
            <Button asChild className="mt-4 rounded-xl">
              <Link href="/marketplace">Back to Marketplace</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getPriceDisplay = (price: number, pricingType: string | null) => {
    const formattedPrice = price.toFixed(2);
    return pricingType === "hourly"
      ? `GH₵${formattedPrice}/hr`
      : pricingType === "negotiable"
        ? `From GH₵${formattedPrice}`
        : `GH₵${formattedPrice}`;
  };

  const getPricingLabel = (pricingType: string | null) => {
    return pricingType === "hourly"
      ? "Hourly"
      : pricingType === "negotiable"
        ? "Negotiable"
        : "Fixed";
  };

  const isOwner = !!user && user.id === service.provider_id;

  const handleBookingClick = () => {
    if (authLoading) return;
    if (!user) {
      router.push(
        `/login?next=${encodeURIComponent(`/marketplace/${service.id}`)}`,
      );
      return;
    }
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Images and Details */}
            <div className="space-y-6">
              <ServiceImages
                title={service.title}
                category={service.category}
                images={service.images}
              />
              <ServiceDetails
                title={service.title}
                description={service.description}
                avgRating={service.avg_rating}
                totalReviews={service.total_reviews}
                totalBookings={service.total_bookings}
              />
            </div>

            {/* Right Column - Sidebar with Price, Tags, Actions */}
            <ServiceSidebar
              serviceId={service.id}
              providerId={service.provider_id}
              isOwner={isOwner}
              authLoading={authLoading}
              onBookingClick={handleBookingClick}
              profiles={service.profiles}
              priceDisplay={getPriceDisplay(
                service.price,
                service.pricing_type,
              )}
              priceLabel={getPricingLabel(service.pricing_type)}
              pricingType={service.pricing_type ?? "fixed"}
              tags={service.tags}
            />
          </div>
        </div>
      </main>

      {bookingModalOpen && (
        <BookingModal
          serviceId={service.id}
          serviceTitle={service.title}
          providerId={service.provider_id}
          servicePrice={service.price}
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
        />
      )}
      <Footer />
    </div>
  );
}
