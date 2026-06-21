"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MarketplaceHeader } from "./components/header";
import { FilterBar } from "./components/filter";
import { ServicesGrid } from "./components/service-grid";
import { MarketplaceCTA } from "./components/cta";

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
  };
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPricing, setSelectedPricing] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 1000,
  });

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
            avatar_url,
            location
          )
        `,
        )
        .eq("status", "approved");

      if (priceRange.min > 0) {
        query = query.gte("price", priceRange.min);
      }
      if (priceRange.max < 1000) {
        query = query.lte("price", priceRange.max);
      }

      switch (sortBy) {
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

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services");
        setLoading(false);
        return;
      }

      setServices(data || []);
      setFilteredServices(data || []);
      const uniqueCategories = [...new Set(data?.map((s) => s.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [sortBy, priceRange]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    let filtered = services;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term) ||
          service.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
          service.category.toLowerCase().includes(term),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (service) => service.category === selectedCategory,
      );
    }

    if (selectedPricing !== "all") {
      filtered = filtered.filter(
        (service) => service.pricing_type === selectedPricing,
      );
    }

    setFilteredServices(filtered);
  }, [searchTerm, selectedCategory, selectedPricing, services]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedPricing("all");
    setPriceRange({ min: 0, max: 1000 });
  };

  // Fix: Convert to boolean properly
  const hasActiveFilters = Boolean(
    searchTerm ||
    selectedCategory !== "all" ||
    selectedPricing !== "all" ||
    priceRange.min > 0 ||
    priceRange.max < 1000,
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MarketplaceHeader count={filteredServices.length} />

          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            selectedPricing={selectedPricing}
            onPricingChange={setSelectedPricing}
            sortBy={sortBy}
            onSortChange={setSortBy}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            servicesCount={filteredServices.length}
            totalServices={services.length}
          />

          <ServicesGrid
            services={filteredServices}
            loading={loading}
            onClearFilters={clearFilters}
          />
        </div>
      </main>

      <MarketplaceCTA user={user} />
      <Footer />
    </div>
  );
}
