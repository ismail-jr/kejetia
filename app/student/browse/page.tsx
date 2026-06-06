"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import ServiceGrid from "@/components/marketplace/ServiceGrid";
import ServiceFilter, {
  ServiceFilters,
} from "@/components/marketplace/ServiceFilter";
import type { Database } from "@/lib/database.types";
import { toast } from "sonner";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string };
  is_saved?: boolean;
};

const DEFAULT_FILTERS: ServiceFilters = {
  search: "",
  category: "all",
  minPrice: 0,
  maxPrice: 500,
  sortBy: "newest",
  minRating: 0,
};

export default function BrowsePage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ServiceFilters>(DEFAULT_FILTERS);

  // 1. Fetch Saved Service IDs for the logged-in student
  const fetchSaved = useCallback(async () => {
    if (!user) return;
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

  // 2. Fetch all approved services for browsing and booking
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("services")
        .select("*, profiles(full_name, avatar_url)")
        .eq("status", "approved");

      if (filters.minPrice > 0) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters.maxPrice < 500) {
        query = query.lte("price", filters.maxPrice);
      }
      if (filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }
      if (filters.minRating > 0) {
        query = query.gte("avg_rating", filters.minRating);
      }

      switch (filters.sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (!error && data) {
        setServices(
          (data as any[]).map((s) => ({
            ...s,
            price: typeof s.price === "number" ? s.price : parseFloat(s.price),
            is_saved: savedIds.has(s.id),
          })),
        );
      }
    } catch (err) {
      console.error("Error loading marketplace data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, savedIds]);

  // Synchronize structural layout rendering hooks
  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  useEffect(() => {
    fetchServices();
  }, [filters, user]);

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
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, is_saved: saved } : s)),
    );

    if (saved) {
      toast.promise(
        async () => {
          const { error } = await supabase
            .from("saved_services")
            .insert({ student_id: user.id, service_id: serviceId });

          if (error) throw error;
        },
        {
          loading: "Saving service to your bookmarks...",
          success: "Added to your saved list!",
          error: () => {
            setSavedIds((prev) => {
              const n = new Set(prev);
              n.delete(serviceId);
              return n;
            });
            setServices((prev) =>
              prev.map((s) =>
                s.id === serviceId ? { ...s, is_saved: false } : s,
              ),
            );
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
            setServices((prev) =>
              prev.map((s) =>
                s.id === serviceId ? { ...s, is_saved: true } : s,
              ),
            );
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
        services={services}
        loading={loading}
        onSaveToggle={handleSaveToggle}
        emptyMessage="No approved services match your search. Try different keywords or filters."
      />
    </div>
  );
}
