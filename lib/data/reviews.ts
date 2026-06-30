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

export async function createBookingReview(input: {
  bookingId: string;
  reviewerId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  return createReview({
    booking_id: input.bookingId,
    reviewer_id: input.reviewerId,
    provider_id: input.providerId,
    service_id: input.serviceId,
    rating: input.rating,
    comment: input.comment?.trim() ?? "",
  });
}

export type ReviewWithDetails = Review & {
  reviewer: { full_name: string; avatar_url: string | null } | null;
  service: { title: string } | null;
};

export async function listProviderReviewsWithDetails(
  providerId: string,
): Promise<ReviewWithDetails[]> {
  const reviews = await listProviderReviews(providerId);
  if (reviews.length === 0) return [];

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const serviceIds = [...new Set(reviews.map((r) => r.service_id))];

  const [profilesResult, servicesResult] = await Promise.all([
    db
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", reviewerIds),
    db.from("services").select("id, title").in("id", serviceIds),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (servicesResult.error) throw servicesResult.error;

  const profilesMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.user_id, p]),
  );
  const servicesMap = new Map(
    (servicesResult.data ?? []).map((s) => [s.id, s]),
  );

  return reviews.map((review) => ({
    ...review,
    reviewer: profilesMap.get(review.reviewer_id) ?? null,
    service: servicesMap.get(review.service_id) ?? null,
  }));
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
