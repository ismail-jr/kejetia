import { db } from "@/lib/supabase";
import { getPartySummaries } from "@/lib/data/profiles";
import type {
  Service,
  ServiceStatus,
  ServiceWithProvider,
  PartySummary,
} from "@/lib/data/types";

export interface ServiceQuery {
  search?: string;
  category?: string;
  pricingType?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "popular";
  status?: ServiceStatus;
  from?: number;
  to?: number;
}

// Attaches provider identity summaries to a list of services using a
// single batched profiles query (no embedded joins — this codebase has
// repeatedly hit PGRST200 on FK introspection, so lists are stitched
// client-side instead).
async function withProviders(
  services: Service[],
): Promise<ServiceWithProvider[]> {
  if (services.length === 0) return [];

  const summaries = await getPartySummaries(
    services.map((s) => s.provider_id),
  );

  return services.map((s) => {
    const p = summaries.get(s.provider_id);
    const provider: PartySummary | null = p
      ? {
          user_id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          location: p.location,
          phone: p.phone,
        }
      : null;
    return { ...s, provider };
  });
}

// Lists services (defaults to approved) with optional filtering, sorting
// and range-based pagination. Returns the rows plus the total count for
// pagination UIs.
export async function listServices(
  query: ServiceQuery = {},
): Promise<{ services: ServiceWithProvider[]; count: number }> {
  let q = db
    .from("services")
    .select("*", { count: "exact" })
    .eq("status", query.status ?? "approved");

  if (query.search) {
    q = q.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  }
  if (query.category && query.category !== "all") {
    q = q.eq("category", query.category);
  }
  if (query.pricingType && query.pricingType !== "all") {
    q = q.eq("pricing_type", query.pricingType);
  }
  if (typeof query.minPrice === "number") q = q.gte("price", query.minPrice);
  if (typeof query.maxPrice === "number") q = q.lte("price", query.maxPrice);
  if (query.tags && query.tags.length > 0) q = q.overlaps("tags", query.tags);

  switch (query.sort) {
    case "price_asc":
      q = q.order("price", { ascending: true });
      break;
    case "price_desc":
      q = q.order("price", { ascending: false });
      break;
    case "rating":
      q = q.order("avg_rating", { ascending: false });
      break;
    case "popular":
      q = q.order("total_bookings", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  if (typeof query.from === "number" && typeof query.to === "number") {
    q = q.range(query.from, query.to);
  }

  const { data, error, count } = await q;
  if (error) throw error;

  const services = await withProviders((data ?? []) as Service[]);
  return { services, count: count ?? 0 };
}

// A single service with its provider identity summary.
export async function getServiceWithProvider(
  id: string,
  opts: { requireApproved?: boolean } = {},
): Promise<ServiceWithProvider | null> {
  let q = db.from("services").select("*").eq("id", id);
  if (opts.requireApproved) q = q.eq("status", "approved");

  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [withProvider] = await withProviders([data as Service]);
  return withProvider;
}

// Provider-owned listings (any status).
export async function listProviderServices(
  providerId: string,
): Promise<Service[]> {
  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function listCategories(): Promise<string[]> {
  const { data, error } = await db
    .from("services")
    .select("category")
    .eq("status", "approved");

  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.category).filter(Boolean))];
}
