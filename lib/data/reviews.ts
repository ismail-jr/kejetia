import { db } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { Review } from "@/lib/data/types";

export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];

export async function listProviderReviews(
  providerId: string,
): Promise<Review[]> {
  const { data, error } = await db
    .from("reviews")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function listServiceReviews(
  serviceId: string,
): Promise<Review[]> {
  const { data, error } = await db
    .from("reviews")
    .select("*")
    .eq("service_id", serviceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function createReview(input: ReviewInsert): Promise<Review> {
  const { data, error } = await db
    .from("reviews")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data as Review;
}

// Returns review rating keyed by booking_id for a set of bookings, so a
// bookings list can show whether each one has been reviewed.
export async function getReviewRatingsByBooking(
  bookingIds: string[],
): Promise<Map<string, number>> {
  const unique = [...new Set(bookingIds)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const { data, error } = await db
    .from("reviews")
    .select("booking_id, rating")
    .in("booking_id", unique);

  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.booking_id, r.rating]));
}
