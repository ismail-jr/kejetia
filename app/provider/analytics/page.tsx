"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/dashboard/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { DollarSign, Star, Users, TrendingUp, Briefcase } from "lucide-react";

export default function ProviderAnalyticsPage() {
  const { profile } = useAuth();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!profile) return;
      const [bookingsRes, reviewsRes, servicesRes] = await Promise.all([
        supabase.from("bookings").select("*").eq("provider_id", profile.id),
        supabase.from("reviews").select("rating").eq("provider_id", profile.id),
        supabase.from("services").select("id").eq("provider_id", profile.id),
      ]);

      const bookings = bookingsRes.data || [];
      const reviews = reviewsRes.data || [];
      const completed = bookings.filter((b) => b.status === "completed");
      const totalEarnings = completed.reduce((s, b) => s + Number(b.amount), 0);
      const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

      setStats({
        totalEarnings,
        totalBookings: bookings.length,
        completedBookings: completed.length,
        avgRating,
        totalReviews: reviews.length,
        totalServices: servicesRes.data?.length || 0,
      });

      // Monthly earnings for the last 6 months
      const months: { [key: string]: { earnings: number; bookings: number } } =
        {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("en", {
          month: "short",
          year: "2-digit",
        });
        months[key] = { earnings: 0, bookings: 0 };
      }
      completed.forEach((b) => {
        const d = new Date(b.created_at);
        const key = d.toLocaleDateString("en", {
          month: "short",
          year: "2-digit",
        });
        if (months[key]) {
          months[key].earnings += Number(b.amount);
          months[key].bookings++;
        }
      });
      setEarningsData(
        Object.entries(months).map(([month, data]) => ({ month, ...data })),
      );
      setLoading(false);
    };
    fetchAnalytics();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your performance and earnings
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Earnings"
          value={`GH₵${stats.totalEarnings.toFixed(0)}`}
          icon={DollarSign}
          iconBg="bg-green-100 dark:bg-green-900/20"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Users}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          change={`${stats.completedBookings} completed`}
          changeType="positive"
        />
        <StatCard
          title="Avg. Rating"
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
          icon={Star}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-500"
          change={`${stats.totalReviews} reviews`}
          changeType="neutral"
        />
        <StatCard
          title="Active Services"
          value={stats.totalServices}
          icon={Briefcase}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Completion Rate"
          value={
            stats.totalBookings > 0
              ? `${Math.round((stats.completedBookings / stats.totalBookings) * 100)}%`
              : "N/A"
          }
          icon={TrendingUp}
          iconBg="bg-cyan-100 dark:bg-cyan-900/20"
          iconColor="text-cyan-500"
        />
      </div>

      {/* Earnings chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-5">
          Monthly Performance
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={earningsData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Bar
                dataKey="earnings"
                name="Earnings (GH₵)"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="bookings"
                name="Bookings"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
