"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Heart,
  Calendar,
  ArrowLeft,
  Tag,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string };
};

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeImage, setActiveImage] = useState<string>("");

  // 1. Fetch Single Service Details along with the Peer Profile information
  const loadServiceDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setService(data as any);
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        }
      }
    } catch (err: any) {
      console.error("Error loading service item parameters:", err);
      toast.error("Could not load service details.");
      router.push("/student/browse");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // 2. Determine if this service item is already bookmarked by the user
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

  const displayPrice =
    typeof service.price === "number"
      ? service.price.toFixed(2)
      : parseFloat(service.price || "0").toFixed(2);

  const providerAvatar =
    service.profiles?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.profiles?.full_name || "UCC"}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button Actions Nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </button>

      {/* Main Structural View Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Aspect Side: Images & Detailed Description Column Layout */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            {/* Primary Media Display Card */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-muted bg-muted shadow-sm">
              <img
                src={activeImage || "/images/placeholder-service.jpg"}
                alt={service.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase text-primary tracking-wider">
                {service.category}
              </span>
            </div>

            {/* Sub-image Gallery Thumbnails Carousel block */}
            {service.images && service.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {service.images.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`relative w-20 aspect-video rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                      activeImage === imgUrl
                        ? "border-primary"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description Details Panel */}
          <div className="bg-card text-card-foreground border border-muted rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-foreground">
              Service Description
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {service.description}
            </p>
          </div>
        </div>

        {/* Right Aspect Side: Transaction Summary Booking Column Callouts */}
        <div className="space-y-6">
          <div className="bg-card text-card-foreground border border-muted rounded-2xl p-6 shadow-md space-y-6 sticky top-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-foreground leading-tight tracking-tight">
                {service.title}
              </h1>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-foreground">
                  GH₵{displayPrice}
                </span>
                <button
                  onClick={handleSaveToggle}
                  className={`p-2.5 rounded-xl border border-muted transition ${
                    isSaved
                      ? "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>

            <hr className="border-muted" />

            {/* Provider Student Profile Section Card layout */}
            <div className="p-3 bg-muted/50 rounded-xl flex items-center gap-3 border border-muted/50">
              <img
                src={providerAvatar}
                alt={service.profiles?.full_name}
                className="w-10 h-10 rounded-full object-cover border bg-background"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs text-muted-foreground block font-medium">
                  Offered by UCC Peer
                </span>
                <span className="font-bold text-sm text-foreground block truncate">
                  {service.profiles?.full_name || "UCC Student"}
                </span>
              </div>
            </div>

            {/* Quick Metrics Indicators Grid info layout */}
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="p-3 border border-muted rounded-xl flex flex-col gap-1">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Status
                </span>
                <span className="capitalize">{service.status}</span>
              </div>
              <div className="p-3 border border-muted rounded-xl flex flex-col gap-1">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Posted
                </span>
                <span>{new Date(service.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* The Prime Checkout/Booking Transaction Link Button */}
            <Button
              asChild
              size="lg"
              className="w-full font-bold rounded-xl text-sm shadow-md py-6 active:scale-[0.99] transition"
            >
              <Link href={`/marketplace/bookings/new?serviceId=${service.id}`}>
                Book This Service
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
