"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import ServiceGrid from "@/components/marketplace/ServiceGrid";
import ServiceFilter, {
  ServiceFilters,
} from "@/components/marketplace/ServiceFilter";
import type { Database } from "@/lib/database.types";
import { toast } from "sonner";

type DbService = Database["public"]["Tables"]["services"]["Row"];
type PricingType = "fixed" | "hourly" | "negotiable";

interface ExtendedService extends Omit<DbService, "pricing_type"> {
  profiles?: { full_name: string; avatar_url: string } | null;
  is_saved?: boolean;
  pricing_type?: PricingType;
}

const DEFAULT_FILTERS: ServiceFilters = {
  search: "",
  selectedTags: [],
  minPrice: 0,
  maxPrice: 10000,
  sortBy: "newest",
  minRating: 0,
};

export default function BrowsePage() {
  const { user } = useAuth();
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ServiceFilters>(DEFAULT_FILTERS);

  const fetchSaved = useCallback(async () => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    try {
      const { data, error } = await supabase
        .from("saved_services")
        .select("service_id")
        .eq("student_id", user.id);

      if (!error && data) {
        setSavedIds(new Set(data.map((s) => s.service_id)));
      }
    } catch (err) {
      console.error("Error fetching saved status maps:", err);
    }
  }, [user]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
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
        .eq("status", "approved");

      // Apply price filters
      if (filters.minPrice > 0) query = query.gte("price", filters.minPrice);
      if (filters.maxPrice && filters.maxPrice < 10000)
        query = query.lte("price", filters.maxPrice);

      // Apply search filter
      if (filters.search) query = query.ilike("title", `%${filters.search}%`);

      // Apply tag filtering if tags are selected
      if (filters.selectedTags && filters.selectedTags.length > 0) {
        // Use the overlaps operator to find services with any of the selected tags
        query = query.overlaps("tags", filters.selectedTags);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "rating":
          query = query.order("avg_rating", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      setServicesData(data || []);
    } catch (err) {
      console.error("Marketplace relationship execution failed:", err);
      toast.error("Failed to load browse listings feed.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const services = useMemo<ExtendedService[]>(() => {
    return servicesData.map((s) => ({
      ...s,
      provider_id: s.provider_id,
      profiles: s.profiles || null,
      price: typeof s.price === "number" ? s.price : parseFloat(s.price || "0"),
      is_saved: savedIds.has(s.id),
      pricing_type: (s.pricing_type as PricingType) || "fixed",
    }));
  }, [servicesData, savedIds]);

  const handleSaveToggle = async (serviceId: string, saved: boolean) => {
    if (!user) {
      toast.error("You must be logged in to save listings.");
      return;
    }

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(serviceId);
      else next.delete(serviceId);
      return next;
    });

    if (saved) {
      toast.promise(
        async () => {
          const { error } = await supabase
            .from("saved_services")
            .insert({ student_id: user.id, service_id: serviceId });

          if (error) throw error;
        },
        {
          loading: "Saving service...",
          success: "Added to saved list!",
          error: () => {
            setSavedIds((prev) => {
              const n = new Set(prev);
              n.delete(serviceId);
              return n;
            });
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
            .eq("service_id", serviceId);

          if (error) throw error;
        },
        {
          loading: "Unsaving service...",
          success: "Removed from saved list!",
          error: () => {
            setSavedIds((prev) => {
              const n = new Set(prev);
              n.add(serviceId);
              return n;
            });
            return "Could not remove bookmark";
          },
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Browse Services</h1>
        <p className="text-muted-foreground mt-1">
          Discover services offered by UCC students
        </p>
      </div>

      <ServiceFilter filters={filters} onChange={setFilters} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Loading marketplace matches..."
            : `${services.length} service${services.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      <ServiceGrid
        services={services as any}
        loading={loading}
        onSaveToggle={handleSaveToggle}
        emptyMessage="No approved services match your search. Try different keywords or filters."
      />
    </div>
  );
}
