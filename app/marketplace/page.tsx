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

// Services shown per page. 9 divides cleanly into the existing
// 1/2/3-column grid (md:grid-cols-2 lg:grid-cols-3) with no leftover
// partial row at the largest breakpoint.
const PAGE_SIZE = 9;

export default function MarketplacePage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPricing, setSelectedPricing] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 1000,
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalServicesCount, setTotalServicesCount] = useState(0);

  // Debounce the raw search input so every keystroke doesn't fire a new
  // Supabase query — only the settled value (searchTerm) drives fetching.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Reset to page 1 whenever a filter actually changes, so the user isn't
  // stranded on e.g. page 4 of a now much-smaller filtered result set.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedPricing, sortBy, priceRange]);

  // Fetch the full category list once, independent of pagination/filters,
  // so the category dropdown always reflects everything in the catalog
  // rather than just whatever is on the current filtered page.
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("category")
        .eq("status", "approved");

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      const unique = [...new Set((data || []).map((s) => s.category))];
      setCategories(unique);
    };

    fetchCategories();
  }, []);

  // Fetch the unfiltered total once, so "X of Y services" copy and the
  // "Active" filter badge can compare against the true catalog size.
  useEffect(() => {
    const fetchTotalCount = async () => {
      const { count, error } = await supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved");

      if (error) {
        console.error("Error fetching total services count:", error);
        return;
      }

      setTotalServicesCount(count || 0);
    };

    fetchTotalCount();
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

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
          { count: "exact" },
        )
        .eq("status", "approved");

      // Search — matches title, description, or category server-side.
      // Tags aren't included here since Postgres array `ilike` needs a
      // different operator (e.g. array contains); add a `.or()` clause
      // with `tags.cs.{${term}}` if exact-tag search is needed later.
      if (searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(
          `title.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`,
        );
      }

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      if (selectedPricing !== "all") {
        query = query.eq("pricing_type", selectedPricing);
      }

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

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services");
        setLoading(false);
        return;
      }

      setServices(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory, selectedPricing, sortBy, priceRange]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const clearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedPricing("all");
    setPriceRange({ min: 0, max: 1000 });
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    selectedCategory !== "all" ||
    selectedPricing !== "all" ||
    priceRange.min > 0 ||
    priceRange.max < 1000,
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MarketplaceHeader count={totalCount} />

          <FilterBar
            searchTerm={searchInput}
            onSearchChange={setSearchInput}
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
            servicesCount={totalCount}
            totalServices={totalServicesCount}
          />

          <ServicesGrid
            services={services}
            loading={loading}
            onClearFilters={clearFilters}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </main>

      <MarketplaceCTA user={user} />
      <Footer />
    </div>
  );
}
