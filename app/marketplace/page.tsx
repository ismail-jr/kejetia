"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Star,
  Search,
  SlidersHorizontal,
  X,
  Clock,
  DollarSign,
  TrendingUp,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

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

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
  { label: "Most Booked", value: "popular" },
];

const PRICING_TYPE_MAP = {
  fixed: { label: "Fixed", icon: DollarSign },
  hourly: { label: "Hourly", icon: Clock },
  negotiable: { label: "Negotiable", icon: TrendingUp },
};

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
    return (
      PRICING_TYPE_MAP[pricingType as keyof typeof PRICING_TYPE_MAP] ||
      PRICING_TYPE_MAP.fixed
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedPricing("all");
    setPriceRange({ min: 0, max: 1000 });
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "all" ||
    selectedPricing !== "all" ||
    priceRange.min > 0 ||
    priceRange.max < 1000;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Browse Services
                </h1>
                <p className="text-muted-foreground mt-1">
                  Discover services offered by UCC students
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {filteredServices.length} service
                  {filteredServices.length !== 1 ? "s" : ""} found
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-xl h-11 px-4"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5 text-[10px]"
                    >
                      {filteredServices.length !== services.length
                        ? "Active"
                        : ""}
                    </Badge>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="rounded-xl h-11 px-4"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="p-4 rounded-xl border-border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full mt-1.5 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Pricing Type
                    </label>
                    <select
                      value={selectedPricing}
                      onChange={(e) => setSelectedPricing(e.target.value)}
                      className="w-full mt-1.5 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="all">All Pricing</option>
                      <option value="fixed">Fixed Price</option>
                      <option value="hourly">Hourly Rate</option>
                      <option value="negotiable">Negotiable</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Price Range
                    </label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min || ""}
                        onChange={(e) =>
                          setPriceRange({
                            ...priceRange,
                            min: Number(e.target.value) || 0,
                          })
                        }
                        className="h-10 rounded-lg"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max || ""}
                        onChange={(e) =>
                          setPriceRange({
                            ...priceRange,
                            max: Number(e.target.value) || 1000,
                          })
                        }
                        className="h-10 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full mt-1.5 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchTerm}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSearchTerm("")}
                    />
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedCategory("all")}
                    />
                  </Badge>
                )}
                {selectedPricing !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedPricing}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedPricing("all")}
                    />
                  </Badge>
                )}
                {(priceRange.min > 0 || priceRange.max < 1000) && (
                  <Badge variant="secondary" className="gap-1">
                    GH₵{priceRange.min} - GH₵{priceRange.max}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setPriceRange({ min: 0, max: 1000 })}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Services Grid - 3 cards per row */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                No services found
              </h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={clearFilters}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const pricingInfo = getPricingInfo(service.pricing_type);
                const PriceIcon = pricingInfo.icon;
                const priceDisplay = getPriceDisplay(
                  service.price,
                  service.pricing_type,
                );
                const rating = parseFloat(service.avg_rating);
                const hasRating = rating > 0;
                const imageUrl =
                  service.images?.[0] || "/images/placeholder-service.jpg";
                const initials =
                  service.profiles?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U";

                return (
                  <Card
                    key={service.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col"
                  >
                    {/* Image - Click to view details */}
                    <Link
                      href={`/marketplace/${service.id}`}
                      className="block relative h-48 w-full overflow-hidden bg-muted"
                    >
                      <img
                        src={imageUrl}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant="secondary"
                          className="bg-black/60 backdrop-blur-sm text-white border-0"
                        >
                          <PriceIcon className="w-3 h-3 mr-1" />
                          {pricingInfo.label}
                        </Badge>
                      </div>
                      {hasRating && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium text-white">
                            {rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-white/60">
                            ({service.total_reviews})
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col space-y-3">
                      <div>
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                          {service.category}
                        </span>
                        <Link href={`/marketplace/${service.id}`}>
                          <h3 className="font-semibold text-foreground text-base mt-1 hover:text-primary transition-colors line-clamp-1">
                            {service.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {service.description}
                        </p>
                      </div>

                      {/* Provider Info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={service.profiles?.avatar_url} />
                          <AvatarFallback className="text-[8px]">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {service.profiles?.full_name || "UCC Student"}
                        </span>
                        {service.profiles?.location && (
                          <>
                            <span>•</span>
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {service.profiles.location}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Tags */}
                      {service.tags && service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {service.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {service.tags.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{service.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
                        <div>
                          <span className="text-lg font-bold text-primary">
                            {priceDisplay}
                          </span>
                        </div>
                        <Button asChild size="sm" className="rounded-xl">
                          <Link href={`/marketplace/${service.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* CTA Section before Footer */}
      <section className="border-t border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Ready to connect?
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Find the perfect service for your needs
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Browse through our verified UCC student services.
              <span className="font-semibold text-primary">
                {" "}
                Login to your dashboard
              </span>{" "}
              to book a service, chat with providers, and manage all your
              bookings in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Button asChild className="rounded-xl px-8 gap-2">
                <Link href={user ? "student/dashboard" : "/login"}>
                  {user ? "Go to Dashboard" : "Login to Book"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              {!user && (
                <Button variant="outline" asChild className="rounded-xl px-8">
                  <Link href="/register">Create Account</Link>
                </Button>
              )}
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground mt-4">
                Register with your UCC email to get started
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
