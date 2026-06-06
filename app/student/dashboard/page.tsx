"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/dashboard/StatCard";
import ServiceCard from "@/components/marketplace/ServiceCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  Search,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string; is_verified: boolean };
  is_saved?: boolean;
};
type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  services?: { title: string; category: string; price: number };
  profiles?: { full_name: string; avatar_url: string };
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
      if (!profile) return;
      const [bookingsRes, servicesRes, savedRes, reviewsRes] =
        await Promise.all([
          supabase
            .from("bookings")
            .select(
              "*, services(title, category, price), profiles!bookings_provider_id_fkey(full_name, avatar_url)",
            )
            .eq("student_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("services")
            .select("*, profiles(full_name, avatar_url, is_verified)")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("saved_services")
            .select("id", { count: "exact" })
            .eq("student_id", profile.id),
          supabase
            .from("reviews")
            .select("id", { count: "exact" })
            .eq("student_id", profile.id),
        ]);
      if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
      if (servicesRes.data) setRecentServices(servicesRes.data as Service[]);
      if (savedRes.count !== null) setSavedCount(savedRes.count);
      if (reviewsRes.count !== null) setReviewsCount(reviewsRes.count);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const totalBookingsCount = bookings.length;
  const activeBookings = bookings.filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(b.status),
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");

  const activePercentage =
    totalBookingsCount > 0
      ? Math.round((activeBookings.length / totalBookingsCount) * 100)
      : 0;
  const completedPercentage =
    totalBookingsCount > 0
      ? Math.round((completedBookings.length / totalBookingsCount) * 100)
      : 0;
  const reviewsPercentage =
    completedBookings.length > 0
      ? Math.min(
          100,
          Math.round((reviewsCount / completedBookings.length) * 100),
        )
      : 0;

  const getStrokeDashoffset = (percentage: number) => {
    return 88 - (88 * percentage) / 100;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground font-heading tracking-tight">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            , {profile?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Here's what's happening with your services today.
          </p>
        </div>
        <Button asChild className="shadow-primary font-heading font-semibold">
          <Link href="/student/browse">
            <Search className="mr-2 w-4 h-4 stroke-[2.5]" />
            Find a Service
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Bookings"
          subtitle="/ Current"
          value={activeBookings.length}
          change={
            activeBookings.length > 0 ? `${activePercentage}%` : undefined
          }
          changeType="neutral"
          changeLabel="of total bookings"
          rightElement={
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-9 h-9 flex items-center justify-center text-primary">
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="stroke-muted"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="stroke-primary transition-all duration-500"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="88"
                    strokeDashoffset={getStrokeDashoffset(activePercentage)}
                  />
                </svg>
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          }
        />

        <StatCard
          title="Completed"
          subtitle="/ Total"
          value={completedBookings.length}
          change={
            completedBookings.length > 0 ? `${completedPercentage}%` : undefined
          }
          changeType="positive"
          changeLabel="success rate"
          rightElement={
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-9 h-9 flex items-center justify-center text-emerald-500">
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="stroke-muted"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="stroke-emerald-500 transition-all duration-500"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="88"
                    strokeDashoffset={getStrokeDashoffset(completedPercentage)}
                  />
                </svg>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
          }
        />

        <StatCard
          title="Saved Services"
          subtitle="/ Marketplace"
          value={savedCount}
          change={savedCount > 0 ? `+${savedCount}` : undefined}
          changeType="positive"
          changeLabel="items watchlisted"
          rightElement={
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-9 h-9 flex items-center justify-center text-rose-500">
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="stroke-muted"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="stroke-rose-500 transition-all duration-500"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="88"
                    strokeDashoffset={savedCount > 0 ? "35" : "88"}
                  />
                </svg>
                <Heart
                  className={cn(
                    "w-3.5 h-3.5 text-rose-500",
                    savedCount > 0 && "fill-current",
                  )}
                />
              </div>
            </div>
          }
        />

        <StatCard
          title="Reviews Given"
          subtitle="/ Evaluation"
          value={reviewsCount}
          change={reviewsCount > 0 ? `${reviewsPercentage}%` : undefined}
          changeType="neutral"
          changeLabel="completion rate"
          rightElement={
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-9 h-9 flex items-center justify-center text-amber-500">
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="stroke-muted"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="stroke-amber-500 transition-all duration-500"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="88"
                    strokeDashoffset={getStrokeDashoffset(reviewsPercentage)}
                  />
                </svg>
                <Star
                  className={cn(
                    "w-3.5 h-3.5 text-amber-500",
                    reviewsCount > 0 && "fill-current",
                  )}
                />
              </div>
            </div>
          }
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold font-heading text-foreground tracking-tight">
              Recent Bookings
            </h2>
            <Link
              href="/student/bookings"
              className="text-xs font-bold font-heading text-primary hover:underline flex items-center gap-1 tracking-wide uppercase"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl animate-pulse bg-muted"
                />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">
                No bookings yet
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 font-heading"
                asChild
              >
                <Link href="/student/browse">Browse Services</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={booking.profiles?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {booking.profiles?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate font-heading leading-tight">
                      {(booking as any).services?.title || "Service"}
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-medium mt-1">
                      {booking.booking_date
                        ? format(new Date(booking.booking_date), "MMM d, yyyy")
                        : "Date TBD"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold tracking-wide capitalize ${STATUS_STYLES[booking.status] || ""}`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                    <p className="text-xs font-black text-foreground font-heading">
                      GH₵{booking.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
            <h2 className="font-bold font-heading text-foreground mb-4 tracking-tight">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                {
                  icon: Search,
                  label: "Browse Services",
                  href: "/student/browse",
                  color: "text-primary bg-primary/5",
                },
                {
                  icon: Heart,
                  label: "Saved Services",
                  href: "/student/saved",
                  color: "text-red-500 bg-red-500/5",
                },
                {
                  icon: MessageSquare,
                  label: "Messages",
                  href: "/student/messages",
                  color: "text-blue-500 bg-blue-500/5",
                },
                {
                  icon: TrendingUp,
                  label: "My Profile",
                  href: "/student/profile",
                  color: "text-green-500 bg-green-500/5",
                },
              ].map(({ icon: Icon, label, href, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border/40 hover:bg-muted/50 transition-all duration-150 group"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${color}`}>
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-sm font-bold text-foreground/90 font-heading tracking-wide">
                    {label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 ml-auto transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Services */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-heading text-foreground tracking-tight">
            Recommended for You
          </h2>
          <Link
            href="/student/browse"
            className="text-xs font-bold font-heading text-primary hover:underline flex items-center gap-1 tracking-wide uppercase"
          >
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-border/60 overflow-hidden space-y-4 p-4 animate-pulse"
                >
                  <div className="h-40 rounded-xl bg-muted w-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))
            : recentServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
        </div>
      </div>
    </div>
  );
}
