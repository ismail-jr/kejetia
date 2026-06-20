"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DashboardHeader } from "./components/header";
import { DashboardStats } from "./components/stats";
import { PendingApprovalAlert } from "./components/pending-approval-alert";
import { RecentOrders } from "./components/recent-orders";
import { MyServicesSummary } from "./components/service-summary";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string | null } | null;
  services?: { title: string } | null;
};

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  pending: { label: "Pending", style: "bg-warning/15 text-warning" },
  confirmed: {
    label: "Confirmed",
    style: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  in_progress: { label: "In Progress", style: "bg-primary/10 text-primary" },
  completed: { label: "Completed", style: "bg-success/15 text-success" },
  cancelled: {
    label: "Cancelled",
    style: "bg-destructive/10 text-destructive",
  },
};

export default function ProviderDashboard() {
  const { user, profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Booking[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [servicesRes, bookingsRes] = await Promise.all([
        supabase
          .from("services")
          .select("*")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("*, services(title)")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      setServices(servicesRes.data || []);

      const bookingsData = bookingsRes.data || [];
      if (bookingsData.length > 0) {
        const clientIds = [...new Set(bookingsData.map((b) => b.client_id))];

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", clientIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]));

        const combinedOrders: Booking[] = bookingsData.map((b) => ({
          ...b,
          profiles: profilesMap.get(b.client_id) || null,
        }));

        setOrders(combinedOrders);

        const completed = combinedOrders.filter(
          (b) => b.status === "completed",
        );
        setTotalEarnings(
          completed.reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
        );
      } else {
        setOrders([]);
        setTotalEarnings(0);
      }

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", user.id);

      if (reviewsError) throw reviewsError;
      if (reviewsData?.length) {
        setAvgRating(
          reviewsData.reduce((s, r) => s + r.rating, 0) / reviewsData.length,
        );
      } else {
        setAvgRating(0);
      }
    } catch (error) {
      console.error("Error fetching provider dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalOrdersCount = orders.length;
  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "in_progress"].includes(o.status),
  );
  const pendingApproval = services.filter((s) => s.status === "pending");
  const approvedServices = services.filter((s) => s.status === "approved");

  return (
    <div className="space-y-8">
      <DashboardHeader fullName={profile?.full_name} />

      <DashboardStats
        approvedServices={approvedServices.length}
        pendingApproval={pendingApproval.length}
        activeOrders={activeOrders.length}
        totalOrdersCount={totalOrdersCount}
        totalEarnings={totalEarnings}
        avgRating={avgRating}
      />

      <PendingApprovalAlert count={pendingApproval.length} />

      <div className="grid lg:grid-cols-3 gap-6">
        <RecentOrders
          orders={orders}
          loading={loading}
          statusMap={STATUS_MAP}
        />
        <MyServicesSummary services={services} />
      </div>
    </div>
  );
}
