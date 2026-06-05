"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase,
  DollarSign,
  Star,
  Users,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string };
  services?: { title: string };
};

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  pending: {
    label: "Pending",
    style:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  confirmed: {
    label: "Confirmed",
    style: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  in_progress: { label: "In Progress", style: "bg-primary/10 text-primary" },
  completed: {
    label: "Completed",
    style:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  cancelled: {
    label: "Cancelled",
    style: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

export default function ProviderDashboard() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Booking[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      const [servicesRes, ordersRes] = await Promise.all([
        supabase
          .from("services")
          .select("*")
          .eq("provider_id", profile.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select(
            "*, profiles!bookings_student_id_fkey(full_name, avatar_url), services(title)",
          )
          .eq("provider_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      if (servicesRes.data) setServices(servicesRes.data);
      if (ordersRes.data) {
        setOrders(ordersRes.data as Booking[]);
        const completed = ordersRes.data.filter(
          (b) => b.status === "completed",
        );
        setTotalEarnings(
          completed.reduce((sum, b) => sum + Number(b.amount), 0),
        );
      }

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", profile.id);
      if (reviewsData?.length) {
        setAvgRating(
          reviewsData.reduce((s, r) => s + r.rating, 0) / reviewsData.length,
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "in_progress"].includes(o.status),
  );
  const pendingApproval = services.filter((s) => s.status === "pending");
  const approvedServices = services.filter((s) => s.status === "approved");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Provider Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name?.split(" ")[0]}
          </p>
        </div>
        <Button asChild className="shadow-primary">
          <Link href="/provider/create">
            <Plus className="mr-2 w-4 h-4" />
            New Service
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Services"
          value={approvedServices.length}
          icon={Briefcase}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          change={
            pendingApproval.length > 0
              ? `${pendingApproval.length} pending`
              : undefined
          }
          changeType="neutral"
        />
        <StatCard
          title="Active Orders"
          value={activeOrders.length}
          icon={Clock}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-500"
        />
        <StatCard
          title="Total Earnings"
          value={`GH₵${totalEarnings.toFixed(0)}`}
          icon={DollarSign}
          iconBg="bg-green-100 dark:bg-green-900/20"
          iconColor="text-green-600"
        />
        <StatCard
          title="Avg. Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
          icon={Star}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-500"
        />
      </div>

      {/* Alerts */}
      {pendingApproval.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            You have {pendingApproval.length} service
            {pendingApproval.length > 1 ? "s" : ""} awaiting admin approval.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
            asChild
          >
            <Link href="/provider/services">View</Link>
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
            <Link
              href="/provider/orders"
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
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No orders yet</p>
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <Link href="/provider/create">Create your first service</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const status = STATUS_MAP[order.status];
                const initials =
                  order.profiles?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2) || "S";
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={order.profiles?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {(order as any).services?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.profiles?.full_name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          status.style,
                        )}
                      >
                        {status.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        GH₵{order.amount}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Services summary */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">My Services</h2>
            <Link
              href="/provider/services"
              className="text-sm text-primary hover:underline"
            >
              Manage
            </Link>
          </div>
          {services.length === 0 ? (
            <div className="text-center py-6">
              <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No services yet
              </p>
              <Button size="sm" asChild className="shadow-primary">
                <Link href="/provider/create">
                  <Plus className="mr-1 w-3.5 h-3.5" />
                  Create Service
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.slice(0, 5).map((service) => (
                <div key={service.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {service.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      GH₵{service.price}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                      service.status === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : service.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : service.status === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-muted text-muted-foreground",
                    )}
                  >
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
