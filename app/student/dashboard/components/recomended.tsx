"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ServiceCard from "@/components/marketplace/ServiceCard";
import type { Database } from "@/lib/database.types";

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// 1. Updated to match the exact schema used in the parent dashboard page
type Service = ServiceRow & {
  profiles?: Pick<ProfileRow, "full_name" | "avatar_url"> | null;
  is_saved?: boolean;
};

interface RecommendedServicesProps {
  services: Service[];
  loading: boolean;
}

export function RecommendedServices({
  services,
  loading,
}: RecommendedServicesProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold font-heading text-foreground tracking-tight">
          Recommended for You
        </h2>
        <Link
          href="/student/browse"
          className="text-xs font-bold font-heading text-primary hover:underline flex items-center gap-1 tracking-wide uppercase"
        >
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card border border-border/60 overflow-hidden space-y-4 p-4 animate-pulse"
              >
                <div className="h-40 rounded-xl bg-muted w-full" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))
          : services.map((service) => (
              // Cast or map if ServiceCard type structurally varies,
              // or match ServiceCard props type definitions directly
              <ServiceCard key={service.id} service={service as any} />
            ))}
      </div>
    </div>
  );
}
