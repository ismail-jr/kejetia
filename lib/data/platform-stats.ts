import { db } from "@/lib/supabase";

export interface PlatformStats {
  activeUsers: number;
  servicesListed: number;
  averageRating: number;
  successRate: number;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const [usersRes, servicesRes, reviewsRes, bookingsRes] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }),
    db
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    db.from("reviews").select("rating"),
    db.from("bookings").select("status"),
  ]);

  if (usersRes.error) throw usersRes.error;
  if (servicesRes.error) throw servicesRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  if (bookingsRes.error) throw bookingsRes.error;

  const reviews = reviewsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const completed = bookings.filter((b) => b.status === "completed").length;
  const successRate =
    bookings.length > 0 ? Math.round((completed / bookings.length) * 100) : 0;

  return {
    activeUsers: usersRes.count ?? 0,
    servicesListed: servicesRes.count ?? 0,
    averageRating,
    successRate,
  };
}
