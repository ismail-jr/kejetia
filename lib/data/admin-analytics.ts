import { db } from "@/lib/supabase";

export interface AdminAnalytics {
  users: {
    total: number;
    students: number;
    providers: number;
    admins: number;
    verified: number;
    unverified: number;
  };
  services: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    revenue: number;
  };
  reviews: {
    total: number;
    avgRating: number;
  };
  categoryData: { name: string; value: number }[];
  monthlyData: { month: string; bookings: number; revenue: number }[];
  bookingStatusData: { name: string; value: number }[];
  roleDistribution: { name: string; value: number }[];
  recentUsers: {
    user_id: string;
    full_name: string;
    email: string;
    created_at: string;
    is_verified: boolean;
    roles: string[];
  }[];
}

function countByRole(roles: string[] | null, role: string) {
  return (roles ?? []).includes(role);
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const [profilesRes, servicesRes, bookingsRes, reviewsRes] = await Promise.all([
    db.from("profiles").select("user_id, full_name, email, roles, is_verified, is_admin, created_at"),
    db.from("services").select("status, category"),
    db.from("bookings").select("status, total_amount, created_at"),
    db.from("reviews").select("rating"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (servicesRes.error) throw servicesRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;

  const profiles = profilesRes.data ?? [];
  const services = servicesRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  const completed = bookings.filter((b) => b.status === "completed");
  const pendingBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed",
  );
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  const catCounts: Record<string, number> = {};
  services.forEach((s) => {
    catCounts[s.category] = (catCounts[s.category] || 0) + 1;
  });

  const statusCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });

  const months: Record<string, { bookings: number; revenue: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months[d.toLocaleDateString("en", { month: "short" })] = {
      bookings: 0,
      revenue: 0,
    };
  }
  bookings.forEach((b) => {
    const key = new Date(b.created_at).toLocaleDateString("en", {
      month: "short",
    });
    if (months[key]) {
      months[key].bookings++;
      if (b.status === "completed") {
        months[key].revenue += Number(b.total_amount);
      }
    }
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return {
    users: {
      total: profiles.length,
      students: profiles.filter((p) => countByRole(p.roles, "student")).length,
      providers: profiles.filter((p) => countByRole(p.roles, "provider")).length,
      admins: profiles.filter((p) => p.is_admin).length,
      verified: profiles.filter((p) => p.is_verified).length,
      unverified: profiles.filter((p) => !p.is_verified).length,
    },
    services: {
      total: services.length,
      approved: services.filter((s) => s.status === "approved").length,
      pending: services.filter((s) => s.status === "pending").length,
      rejected: services.filter((s) => s.status === "rejected").length,
    },
    bookings: {
      total: bookings.length,
      completed: completed.length,
      pending: pendingBookings.length,
      cancelled: cancelledBookings.length,
      revenue: completed.reduce((s, b) => s + Number(b.total_amount), 0),
    },
    reviews: {
      total: reviews.length,
      avgRating,
    },
    categoryData: Object.entries(catCounts).map(([name, value]) => ({
      name,
      value,
    })),
    monthlyData: Object.entries(months).map(([month, data]) => ({
      month,
      ...data,
    })),
    bookingStatusData: Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    })),
    roleDistribution: [
      {
        name: "Students",
        value: profiles.filter((p) => countByRole(p.roles, "student")).length,
      },
      {
        name: "Providers",
        value: profiles.filter((p) => countByRole(p.roles, "provider")).length,
      },
      {
        name: "Admins",
        value: profiles.filter((p) => p.is_admin).length,
      },
    ].filter((d) => d.value > 0),
    recentUsers: profiles
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 8)
      .map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        created_at: p.created_at,
        is_verified: p.is_verified,
        roles: p.roles ?? [],
      })),
  };
}
