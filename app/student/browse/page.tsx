"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import ServiceGrid from "@/components/marketplace/ServiceGrid";
import ServiceFilter, {
  ServiceFilters,
} from "@/components/marketplace/ServiceFilter";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string; is_verified: boolean };
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

  const fetchSaved = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_services")
      .select("service_id")
      .eq("student_id", user.id);
    setSavedIds(new Set(data?.map((s) => s.service_id) || []));
  }, [user]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("services")
      .select("*, profiles(full_name, avatar_url, is_verified)")
      .eq("status", "approved")
      .gte("price", filters.minPrice)
      .lte("price", filters.maxPrice);

    if (filters.category !== "all")
      query = query.eq("category", filters.category);
    if (filters.search) query = query.ilike("title", `%${filters.search}%`);
    if (filters.minRating > 0)
      query = query.gte("avg_rating", filters.minRating);

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
      case "popular":
        query = query.order("total_bookings", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data } = await query;
    if (data) {
      setServices(data.map((s) => ({ ...s, is_saved: savedIds.has(s.id) })));
    }
    setLoading(false);
  }, [filters, savedIds]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);
  useEffect(() => {
    fetchServices();
  }, [filters]);

  const handleSaveToggle = (serviceId: string, saved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(serviceId);
      else next.delete(serviceId);
      return next;
    });
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, is_saved: saved } : s)),
    );
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
            ? "Loading..."
            : `${services.length} service${services.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      <ServiceGrid
        services={services}
        loading={loading}
        onSaveToggle={handleSaveToggle}
        emptyMessage="No services match your search. Try different keywords or filters."
      />
    </div>
  );
}
