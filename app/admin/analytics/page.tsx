"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchAdminAnalytics,
  type AdminAnalytics,
} from "@/lib/data/admin-analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Star,
  ShieldCheck,
  UserX,
  ArrowRight,
} from "lucide-react";

const PIE_COLORS = [
  "hsl(245,100%,67%)",
  "hsl(193,100%,42%)",
  "hsl(142,71%,45%)",
  "hsl(38,92%,50%)",
  "hsl(0,72%,51%)",
];

const EMPTY_ANALYTICS: AdminAnalytics = {
  users: {
    total: 0,
    students: 0,
    providers: 0,
    admins: 0,
    verified: 0,
    unverified: 0,
  },
  services: { total: 0, approved: 0, pending: 0, rejected: 0 },
  bookings: {
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0,
  },
  reviews: { total: 0, avgRating: 0 },
  categoryData: [],
  monthlyData: [],
  bookingStatusData: [],
  roleDistribution: [],
  recentUsers: [],
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalytics>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const analytics = await fetchAdminAnalytics();
        if (!cancelled) setData(analytics);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        toast.error("Failed to load platform analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg animate-pulse bg-muted" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse bg-muted" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl animate-pulse bg-muted" />
          <div className="h-72 rounded-2xl animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">
            Platform Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Users, services, bookings, revenue, and verification overview
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/admin/users?filter=unverified">
            Review unverified users
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={data.users.total}
          change={`${data.users.providers} providers`}
          changeType="neutral"
          rightElement={
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
          }
        />
        <StatCard
          title="Verified Users"
          value={data.users.verified}
          change={`${data.users.unverified} pending`}
          changeType={
            data.users.unverified > 0 ? "negative" : "positive"
          }
          rightElement={
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          }
        />
        <StatCard
          title="Total Bookings"
          value={data.bookings.total}
          change={`${data.bookings.completed} completed`}
          changeType="positive"
          rightElement={
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          }
        />
        <StatCard
          title="Total Revenue"
          value={`GH₵${data.bookings.revenue.toFixed(0)}`}
          change={`${data.services.approved} live services`}
          changeType="positive"
          rightElement={
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-500">
              <DollarSign className="w-5 h-5" />
            </div>
          }
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Students"
          value={data.users.students}
          changeType="neutral"
          rightElement={
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-500">
              <Users className="w-5 h-5" />
            </div>
          }
        />
        <StatCard
          title="Services"
          value={data.services.total}
          change={`${data.services.pending} pending approval`}
          changeType={data.services.pending > 0 ? "negative" : "positive"}
          rightElement={
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-500">
              <Briefcase className="w-5 h-5" />
            </div>
          }
        />
        <StatCard
          title="Reviews"
          value={data.reviews.total}
          change={
            data.reviews.total > 0
              ? `${data.reviews.avgRating.toFixed(1)} avg`
              : "No reviews yet"
          }
          changeType="neutral"
          rightElement={
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-500">
              <Star className="w-5 h-5" />
            </div>
          }
        />
        <StatCard
          title="Unverified"
          value={data.users.unverified}
          change="Needs admin review"
          changeType={data.users.unverified > 0 ? "negative" : "positive"}
          rightElement={
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-500">
              <UserX className="w-5 h-5" />
            </div>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-5">
            Monthly Activity & Revenue
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.monthlyData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="bookings"
                  name="Bookings"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (GH₵)"
                  stroke="hsl(38,92%,50%)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-5">
            Services by Category
          </h2>
          <div className="h-60">
            {data.categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No services yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.categoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-5">
            User Roles
          </h2>
          <div className="h-60">
            {data.roleDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No users yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.roleDistribution.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-5">
            Booking Status
          </h2>
          <div className="h-60">
            {data.bookingStatusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No bookings yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.bookingStatusData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Recent Signups</h2>
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href="/admin/users">Manage users</Link>
          </Button>
        </div>
        {data.recentUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No users registered yet
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.recentUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {user.full_name || "No name"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="hidden sm:flex gap-1">
                    {(user.roles.length > 0 ? user.roles : ["student"]).map(
                      (role) => (
                        <Badge
                          key={role}
                          variant="secondary"
                          className="text-[10px] capitalize"
                        >
                          {role}
                        </Badge>
                      ),
                    )}
                  </div>
                  <Badge
                    variant={user.is_verified ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {user.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(user.created_at), "MMM d")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
