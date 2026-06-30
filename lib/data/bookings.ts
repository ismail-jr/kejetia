import { db } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { Booking, BookingStatus, PartySummary, Service } from "@/lib/data/types";
import { getPartySummaries } from "@/lib/data/profiles";
import { getReviewRatingsByBooking } from "@/lib/data/reviews";

export type BookingInsert =
  Database["public"]["Tables"]["bookings"]["Insert"];

export type ServiceSummary = Pick<
  Service,
  "id" | "title" | "category" | "price" | "images"
>;

export type ProviderBookingOrder = Booking & {
  client: (PartySummary & { email?: string | null }) | null;
  service: ServiceSummary | null;
};

export type ClientBookingWithDetails = Booking & {
  service: ServiceSummary | null;
  provider: PartySummary | null;
  hasReview: boolean;
  reviewRating: number | null;
};

export function isReviewEligible(
  booking: Pick<Booking, "status" | "payment_status">,
  hasReview: boolean,
): boolean {
  return (
    booking.status === "completed" &&
    booking.payment_status === "paid" &&
    !hasReview
  );
}

export async function listClientBookings(
  clientId: string,
): Promise<Booking[]> {
  const { data, error } = await db
    .from("bookings")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function listClientBookingsWithDetails(
  clientId: string,
): Promise<ClientBookingWithDetails[]> {
  const bookings = await listClientBookings(clientId);
  if (bookings.length === 0) return [];

  const serviceIds = [...new Set(bookings.map((b) => b.service_id))];
  const providerIds = [...new Set(bookings.map((b) => b.provider_id))];
  const bookingIds = bookings.map((b) => b.id);

  const [servicesResult, partyMap, reviewMap] = await Promise.all([
    db
      .from("services")
      .select("id, title, category, price, images")
      .in("id", serviceIds),
    getPartySummaries(providerIds),
    getReviewRatingsByBooking(bookingIds),
  ]);

  if (servicesResult.error) throw servicesResult.error;

  const servicesMap = new Map(
    (servicesResult.data ?? []).map((s) => [s.id, s as ServiceSummary]),
  );

  return bookings.map((booking) => ({
    ...booking,
    service: servicesMap.get(booking.service_id) ?? null,
    provider: partyMap.get(booking.provider_id) ?? null,
    hasReview: reviewMap.has(booking.id),
    reviewRating: reviewMap.get(booking.id) ?? null,
  }));
}

export async function listProviderBookings(
  providerId: string,
): Promise<Booking[]> {
  const { data, error } = await db
    .from("bookings")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function listProviderBookingsWithDetails(
  providerId: string,
): Promise<ProviderBookingOrder[]> {
  const bookings = await listProviderBookings(providerId);
  if (bookings.length === 0) return [];

  const clientIds = [...new Set(bookings.map((b) => b.client_id))];
  const serviceIds = [...new Set(bookings.map((b) => b.service_id))];

  const [partyMap, servicesResult, profilesResult] = await Promise.all([
    getPartySummaries(clientIds),
    db
      .from("services")
      .select("id, title, category, price, images")
      .in("id", serviceIds),
    db.from("profiles").select("user_id, email").in("user_id", clientIds),
  ]);

  if (servicesResult.error) throw servicesResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const emailByUserId = new Map(
    (profilesResult.data ?? []).map((p) => [p.user_id, p.email]),
  );
  const servicesMap = new Map(
    (servicesResult.data ?? []).map((s) => [s.id, s as ServiceSummary]),
  );

  return bookings.map((booking) => {
    const party = partyMap.get(booking.client_id);
    return {
      ...booking,
      client: party
        ? { ...party, email: emailByUserId.get(booking.client_id) ?? null }
        : null,
      service: servicesMap.get(booking.service_id) ?? null,
    };
  });
}

export async function createBooking(input: BookingInsert): Promise<Booking> {
  if (input.client_id === input.provider_id) {
    throw new Error("You cannot book your own service.");
  }

  const { data, error } = await db
    .from("bookings")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<void> {
  const { error } = await db
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) throw error;
}

export async function markBookingPaid(bookingId: string): Promise<void> {
  const { error } = await db
    .from("bookings")
    .update({ payment_status: "paid" })
    .eq("id", bookingId);

  if (error) throw error;
}
