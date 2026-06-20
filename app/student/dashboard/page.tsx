"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DashboardHeader } from "./components/header";
import { StatsGrid } from "./components/stats";
import { RecentBookings } from "./components/recent-bookings";
import { QuickActions } from "./components/quick-actions";
import { RecommendedServices } from "./components/recomended";
import type { Database } from "@/lib/database.types";

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export type Service = ServiceRow & {
  profiles?: Pick<ProfileRow, "full_name" | "avatar_url"> | null;
  is_saved?: boolean;
};

export type Booking = BookingRow & {
  services?: Pick<ServiceRow, "title" | "category" | "price" | "images"> | null;
  profiles?: Pick<ProfileRow, "full_name" | "avatar_url"> | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-primary/10 text-primary",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentServices, setRecentServices] = useState<Service[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const userId = profile?.user_id;

      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("client_id", userId)
          .order("created_at", { ascending: false });

        if (bookingsError) {
          console.error("Bookings error:", bookingsError);
          toast.error("Failed to fetch bookings");
          setBookings([]);
        } else if (bookingsData && bookingsData.length > 0) {
          const serviceIds = bookingsData
            .map((b) => b.service_id)
            .filter(Boolean);
          const providerIds = bookingsData
            .map((b) => b.provider_id)
            .filter(Boolean);

          let servicesMap = new Map();
          if (serviceIds.length > 0) {
            const { data: servicesData, error: servicesError } = await supabase
              .from("services")
              .select("id, title, category, price, images")
              .in("id", serviceIds);

            if (!servicesError && servicesData) {
              servicesMap = new Map(servicesData.map((s) => [s.id, s]));
            }
          }

          let providersMap = new Map();
          if (providerIds.length > 0) {
            const { data: providersData, error: providersError } =
              await supabase
                .from("profiles")
                .select("user_id, full_name, avatar_url")
                .in("user_id", providerIds);

            if (!providersError && providersData) {
              providersMap = new Map(providersData.map((p) => [p.user_id, p]));
            }
          }

          const combinedBookings: Booking[] = bookingsData.map((booking) => ({
            ...booking,
            services: servicesMap.get(booking.service_id) || null,
            profiles: providersMap.get(booking.provider_id) || null,
          }));

          setBookings(combinedBookings);
        } else {
          setBookings([]);
        }

        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select(
            `
            *,
            profiles:provider_id (
              full_name,
              avatar_url
            )
          `,
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(4);

        if (servicesError) {
          console.error("Services error:", servicesError);
        } else if (servicesData) {
          setRecentServices(servicesData as unknown as Service[]);
        }

        const { count: savedCountResult, error: savedError } = await supabase
          .from("saved_services")
          .select("id", { count: "exact", head: true })
          .eq("student_id", userId);

        if (!savedError) setSavedCount(savedCountResult || 0);

        const { count: reviewsCountResult, error: reviewsError } =
          await supabase
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .eq("reviewer_id", userId);

        if (!reviewsError) setReviewsCount(reviewsCountResult || 0);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const totalBookingsCount = bookings.length;
  const activeBookings = bookings.filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(b.status),
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");

  return (
    <div className="space-y-8">
      <DashboardHeader fullName={profile?.full_name} />

      <StatsGrid
        activeBookings={activeBookings.length}
        completedBookings={completedBookings.length}
        savedCount={savedCount}
        reviewsCount={reviewsCount}
        totalBookingsCount={totalBookingsCount}
        completedBookingsTotal={completedBookings.length}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <RecentBookings
          // Explicit typing avoids cross-file structure mismatches
          bookings={bookings as any}
          loading={loading}
          statusStyles={STATUS_STYLES}
        />
        <QuickActions />
      </div>

      <RecommendedServices services={recentServices} loading={loading} />
    </div>
  );
}
