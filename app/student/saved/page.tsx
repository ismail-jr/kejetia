"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import ServiceGrid from "@/components/marketplace/ServiceGrid";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type PricingType = "fixed" | "hourly" | "negotiable";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string } | null;
  is_saved?: boolean;
  pricing_type?: PricingType;
};

export default function SavedPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: savedEntries, error: savedError } = await supabase
        .from("saved_services")
        .select("service_id")
        .eq("student_id", user.id);

      if (savedError) throw savedError;

      // If the user hasn't saved anything, empty state right away
      if (!savedEntries || savedEntries.length === 0) {
        setServices([]);
        return;
      }

      const savedServiceIds = savedEntries.map((entry) => entry.service_id);

      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select(
          `
          *,
          profiles:provider_id (
            full_name,
            avatar_url
          )
        `,
        )
        .in("id", savedServiceIds);

      if (servicesError) throw servicesError;

      // Map data to mark them all as saved for the UI components
      const mapped: Service[] = (servicesData || []).map((service) => ({
        ...service,
        profiles: service.profiles || null,
        is_saved: true,
        pricing_type: (service.pricing_type as PricingType) || "fixed",
      }));

      setServices(mapped);
    } catch (err: any) {
      console.error("Error loading wishlist items:", err);
      toast.error("Could not fetch your saved bookmarks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [user]);

  const handleSaveToggle = async (serviceId: string, saved: boolean) => {
    if (!user) {
      toast.error("Please log in to manage saved services");
      return;
    }

    if (!saved) {
      const originalServices = [...services];
      setServices((prev) => prev.filter((s) => s.id !== serviceId));

      toast.promise(
        async () => {
          const { error } = await supabase
            .from("saved_services")
            .delete()
            .eq("student_id", user.id)
            .eq("service_id", serviceId);

          if (error) throw error;
        },
        {
          loading: "Removing from saved list...",
          success: "Removed from bookmarks!",
          error: () => {
            setServices(originalServices);
            return "Failed to remove from saved";
          },
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Services</h1>
          <p className="text-muted-foreground text-sm">
            Services you&apos;ve bookmarked
          </p>
        </div>
      </div>

      <ServiceGrid
        services={services}
        loading={loading}
        onSaveToggle={handleSaveToggle}
        emptyMessage="You haven't saved any services yet. Browse and save services you're interested in!"
      />

      {!loading && services.length === 0 && (
        <div className="text-center mt-4">
          <Button asChild>
            <Link href="/student/browse">Browse Services</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
