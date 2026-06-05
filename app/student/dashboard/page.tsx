"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/dashboard/StatCard";
import ServiceCard from "@/components/marketplace/ServiceCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      const [bookingsRes, servicesRes, savedRes] = await Promise.all([
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
          .select("id")
          .eq("student_id", profile.id),
      ]);
      if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
      if (servicesRes.data) setRecentServices(servicesRes.data as Service[]);
      if (savedRes.data) setSavedCount(savedRes.data.length);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const activeBookings = bookings.filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(b.status),
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            , {profile?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your services today.
          </p>
        </div>
        <Button asChild className="shadow-primary">
          <Link href="/student/browse">
            <Search className="mr-2 w-4 h-4" />
            Find a Service
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Bookings"
          value={activeBookings.length}
          icon={Calendar}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          change={
            activeBookings.length > 0
              ? `${activeBookings.length} pending`
              : undefined
          }
          changeType="neutral"
        />
        <StatCard
          title="Completed"
          value={completedBookings.length}
          icon={CheckCircle}
          iconBg="bg-green-100 dark:bg-green-900/20"
          iconColor="text-green-600"
          change={completedBookings.length > 0 ? "All done" : undefined}
          changeType="positive"
        />
        <StatCard
          title="Saved Services"
          value={savedCount}
          icon={Heart}
          iconBg="bg-red-100 dark:bg-red-900/20"
          iconColor="text-red-500"
        />
        <StatCard
          title="Reviews Given"
          value={completedBookings.length}
          icon={Star}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">Recent Bookings</h2>
            <Link
              href="/student/bookings"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No bookings yet</p>
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <Link href="/student/browse">Browse Services</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-9 h-9 flex-shrink-0">
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
                    <p className="font-medium text-sm text-foreground truncate">
                      {(booking as any).services?.title || "Service"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.booking_date
                        ? format(new Date(booking.booking_date), "MMM d, yyyy")
                        : "Date TBD"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[booking.status] || ""}`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                {
                  icon: Search,
                  label: "Browse Services",
                  href: "/student/browse",
                  color: "text-primary",
                },
                {
                  icon: Heart,
                  label: "Saved Services",
                  href: "/student/saved",
                  color: "text-red-500",
                },
                {
                  icon: MessageSquare,
                  label: "Messages",
                  href: "/student/messages",
                  color: "text-blue-500",
                },
                {
                  icon: TrendingUp,
                  label: "My Profile",
                  href: "/student/profile",
                  color: "text-green-500",
                },
              ].map(({ icon: Icon, label, href, color }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm text-foreground">{label}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Services */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            Recommended for You
          </h2>
          <Link
            href="/student/browse"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  <div className="h-44 animate-shimmer" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 rounded animate-shimmer" />
                    <div className="h-3 w-1/2 rounded animate-shimmer" />
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
