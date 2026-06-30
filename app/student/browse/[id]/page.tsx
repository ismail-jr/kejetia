"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";
import { ImageGallery } from "../components/image-gallery";
import { PriceDisplay } from "../components/price-display";
import { SaveButton } from "../components/save-btn";
import { ProviderProfile } from "../components/provider-profile";
import { ServiceMetadata } from "../components/service-matadata";
import { PricingInfoBox } from "../components/pricing-info-box";
import BookingModal from "@/components/booking/booking-modal";
import { isOwnService } from "@/lib/utils/booking";

type PricingType = "fixed" | "hourly" | "negotiable";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: {
    full_name: string;
    avatar_url: string;
    phone?: string | null;
    location?: string | null;
  } | null;
  pricing_type?: PricingType;
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const loadServiceDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select(
          `
          *, 
          profiles:provider_id(
            full_name, 
            avatar_url,
            phone,
            location
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setService({
          ...data,
          pricing_type: (data.pricing_type as PricingType) || "fixed",
        } as any);
      }
    } catch (err: any) {
      console.error("Error loading service item parameters:", err);
      toast.error("Could not load service details.");
      router.push("/student/browse");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const checkSavedStatus = useCallback(async () => {
    if (!user || !id) return;
    try {
      const { data, error } = await supabase
        .from("saved_services")
        .select("id")
        .eq("student_id", user.id)
        .eq("service_id", id)
        .maybeSingle();

      if (!error && data) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Saved lookup validation mistake:", err);
    }
  }, [user, id]);

  useEffect(() => {
    loadServiceDetails();
  }, [loadServiceDetails]);

  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error("You must be logged in to save listings.");
      return;
    }

    const initialSavedState = isSaved;
    setIsSaved(!initialSavedState);

    if (!initialSavedState) {
      toast.promise(
        async () => {
          const { error } = await supabase
            .from("saved_services")
            .insert({ student_id: user.id, service_id: id });
          if (error) throw error;
        },
        {
          loading: "Saving bookmark...",
          success: "Added to your saved list!",
          error: () => {
            setIsSaved(initialSavedState);
            return "Could not complete save action";
          },
        },
      );
    } else {
      toast.promise(
        async () => {
          const { error } = await supabase
            .from("saved_services")
            .delete()
            .eq("student_id", user.id)
            .eq("service_id", id);
          if (error) throw error;
        },
        {
          loading: "Removing bookmark...",
          success: "Removed from saved list!",
          error: () => {
            setIsSaved(initialSavedState);
            return "Could not remove bookmark";
          },
        },
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
        <div className="h-6 bg-muted rounded w-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-muted aspect-video rounded-xl w-full" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-20 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) return null;

  const isOwner = isOwnService(user?.id, service.provider_id);

  const getPriceIcon = () => {
    const pricingType = service.pricing_type || "fixed";
    switch (pricingType) {
      case "hourly":
        return require("lucide-react").Clock;
      case "negotiable":
        return require("lucide-react").TrendingUp;
      default:
        return require("lucide-react").DollarSign;
    }
  };

  const PriceIcon = getPriceIcon();

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Description */}
          <div className="lg:col-span-2 space-y-6">
            <ImageGallery
              images={service.images || []}
              category={service.category}
              pricingType={service.pricing_type || "fixed"}
              PriceIcon={PriceIcon}
            />

            {/* Description */}
            <div className="bg-card text-card-foreground border border-muted rounded-2xl p-6 space-y-4 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">
                Service Description
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {service.description}
              </p>

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="space-y-6">
            <div className="bg-card text-card-foreground border border-muted rounded-2xl p-6 shadow-md space-y-6 sticky top-6">
              {/* Title & Price */}
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-foreground">
                  {service.title}
                </h1>
                <div className="flex items-center justify-between pt-1">
                  <PriceDisplay
                    price={
                      typeof service.price === "number"
                        ? service.price
                        : parseFloat(service.price || "0")
                    }
                    pricingType={service.pricing_type || "fixed"}
                    size="large"
                  />
                  <SaveButton isSaved={isSaved} onToggle={handleSaveToggle} />
                </div>
              </div>

              <hr className="border-muted" />

              {/* Provider Profile */}
              <ProviderProfile
                providerId={service.provider_id}
                fullName={service.profiles?.full_name || "UCC Student"}
                avatarUrl={service.profiles?.avatar_url}
                phone={service.profiles?.phone}
                location={service.profiles?.location}
              />

              {/* Metadata */}
              <ServiceMetadata
                status={service.status}
                createdAt={service.created_at}
              />

              {/* Pricing Info */}
              <PricingInfoBox pricingType={service.pricing_type || "fixed"} />

              {/* Book — providers cannot book their own listings */}
              {isOwner ? (
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full font-bold rounded-xl text-sm py-6"
                  asChild
                >
                  <Link href="/provider/services">Manage Your Listing</Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full font-bold rounded-xl text-sm shadow-md py-6 active:scale-[0.99] transition"
                  onClick={() => setIsBookingModalOpen(true)}
                >
                  Book This Service
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {service && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          serviceId={service.id}
          serviceTitle={service.title}
          providerId={service.provider_id}
          servicePrice={
            typeof service.price === "number"
              ? service.price
              : parseFloat(service.price || "0")
          }
        />
      )}
    </>
  );
}
