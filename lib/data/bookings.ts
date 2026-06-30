import { db } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { Booking, BookingStatus } from "@/lib/data/types";

export type BookingInsert =
  Database["public"]["Tables"]["bookings"]["Insert"];

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
