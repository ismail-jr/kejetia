"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AnalyticsStats } from "./components/stats";
import { MonthlyPerformanceChart } from "./components/monthly-perf-chart";
import { RecentActivity } from "./components/recent-activity";
import { EarningsSummary } from "./components/earning-summary";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";

export default function ProviderAnalyticsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalBookings: 0,
    completedBookings: 0,
    avgRating: 0,
    totalReviews: 0,
    totalServices: 0,
  });
  const [earningsData, setEarningsData] = useState<
    { month: string; earnings: number; bookings: number }[]
  >([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userId = profile.user_id;

        // 1. Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("provider_id", userId);

        if (bookingsError) {
          console.error("Bookings error:", bookingsError);
          throw bookingsError;
        }

        const bookings = bookingsData || [];

        // 2. Fetch services for the bookings
        let servicesMap = new Map();
        if (bookings.length > 0) {
          const serviceIds = [
            ...new Set(bookings.map((b) => b.service_id)),
          ].filter(Boolean);
          if (serviceIds.length > 0) {
            const { data: servicesData, error: servicesError } = await supabase
              .from("services")
              .select("id, title, category, price")
              .in("id", serviceIds);

            if (!servicesError && servicesData) {
              servicesMap = new Map(servicesData.map((s) => [s.id, s]));
            }
          }
        }

        // 3. Fetch student profiles for the bookings
        let studentsMap = new Map();
        if (bookings.length > 0) {
          const studentIds = [
            ...new Set(bookings.map((b) => b.client_id)),
          ].filter(Boolean);
          if (studentIds.length > 0) {
            const { data: studentsData, error: studentsError } = await supabase
              .from("profiles")
              .select("user_id, full_name, avatar_url, email")
              .in("user_id", studentIds);

            if (!studentsError && studentsData) {
              studentsMap = new Map(studentsData.map((s) => [s.user_id, s]));
            }
          }
        }

        // 4. Combine booking data
        const combinedBookings = bookings.map((booking) => ({
          ...booking,
          services: servicesMap.get(booking.service_id) || null,
          student: studentsMap.get(booking.client_id) || null,
        }));

        setRecentBookings(combinedBookings);

        // 5. Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("rating")
          .eq("provider_id", userId);

        if (reviewsError) {
          console.error("Reviews error:", reviewsError);
          throw reviewsError;
        }

        // 6. Fetch services count
        const { count: servicesCount, error: servicesError } = await supabase
          .from("services")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", userId);

        if (servicesError) {
          console.error("Services count error:", servicesError);
          throw servicesError;
        }

        // Calculate stats
        const completed = bookings.filter((b: any) => b.status === "completed");
        const totalEarnings = completed.reduce(
          (s: number, b: any) => s + Number(b.total_amount || b.amount || 0),
          0,
        );
        const avgRating = reviewsData?.length
          ? reviewsData.reduce((s, r) => s + r.rating, 0) / reviewsData.length
          : 0;

        setStats({
          totalEarnings,
          totalBookings: bookings.length,
          completedBookings: completed.length,
          avgRating,
          totalReviews: reviewsData?.length || 0,
          totalServices: servicesCount || 0,
        });

        // Monthly earnings for the last 6 months
        const months: {
          [key: string]: { earnings: number; bookings: number };
        } = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleDateString("en", {
            month: "short",
            year: "2-digit",
          });
          months[key] = { earnings: 0, bookings: 0 };
        }

        completed.forEach((b: any) => {
          const d = new Date(b.created_at);
          const key = d.toLocaleDateString("en", {
            month: "short",
            year: "2-digit",
          });
          if (months[key]) {
            months[key].earnings += Number(b.total_amount || b.amount || 0);
            months[key].bookings++;
          }
        });

        setEarningsData(
          Object.entries(months).map(([month, data]) => ({ month, ...data })),
        );
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [profile]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Track your performance and earnings
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl">
          <Calendar className="w-4 h-4" />
          <span>Last 6 months</span>
        </div>
      </div>

      {/* Stats Cards */}
      <AnalyticsStats stats={stats} />

      {/* Earnings Summary */}
      <EarningsSummary
        data={earningsData}
        totalEarnings={stats.totalEarnings}
      />

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border border-border/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Monthly Performance
              </h2>
              <Tabs defaultValue="earnings" className="w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="earnings" className="text-xs">
                    Earnings
                  </TabsTrigger>
                  <TabsTrigger value="bookings" className="text-xs">
                    Bookings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="h-80">
              <MonthlyPerformanceChart data={earningsData} />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="rounded-2xl border border-border/60 p-6 h-full">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
            <RecentActivity bookings={recentBookings} loading={loading} />
          </Card>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 shadow-lg flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading your analytics...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
