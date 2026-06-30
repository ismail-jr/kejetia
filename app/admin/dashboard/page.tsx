"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Briefcase,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    services: 0,
    pendingServices: 0,
    reports: 0,
  });
  const [pendingServices, setPendingServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, servicesRes, pendingRes, reportsRes] = await Promise.all(
        [
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("services").select("*", { count: "exact", head: true }),
          supabase
            .from("services")
            .select("*, profiles(full_name)")
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(5),
          supabase
            .from("reports")
            .select("id", { count: "exact" })
            .eq("status", "open"),
        ],
      );

      setStats({
        users: usersRes.count || 0,
        services: servicesRes.count || 0,
        pendingServices: pendingRes.data?.length || 0,
        reports: reportsRes.count || 0,
      });
      if (pendingRes.data) setPendingServices(pendingRes.data as Service[]);
      loading && setLoading(false);
    };
    fetchData();
  }, []);

  // Programmatic progress scales based on operational platform depth
  const operationsTotal = stats.services + stats.pendingServices;
  const approvalsPercentage =
    operationsTotal > 0
      ? Math.round((stats.services / operationsTotal) * 100)
      : 100;

  const reportTotalThreat = 100;
  const reportPercentage = Math.min(
    100,
    stats.reports > 0
      ? Math.round((stats.reports / reportTotalThreat) * 100)
      : 0,
  );

  const getStrokeDashoffset = (percentage: number) => {
    return 88 - (88 * percentage) / 100;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground font-heading tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Platform overview and management metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Users"
          subtitle="/ Registrations"
          value={stats.users}
          change={stats.users > 0 ? `+${stats.users}` : undefined}
          changeType="positive"
          changeLabel="active accounts"
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
                    className="stroke-primary"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="88"
                    strokeDashoffset="25"
                  />
                </svg>
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          }
        />

        <StatCard
          title="Total Services"
          subtitle="/ Active Listings"
          value={stats.services}
          change={stats.services > 0 ? "Live" : undefined}
          changeType="neutral"
          changeLabel="marketplace catalog"
          rightElement={
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-9 h-9 flex items-center justify-center text-blue-500">
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
                    className="stroke-blue-500"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="88"
                    strokeDashoffset="15"
                  />
                </svg>
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </div>
          }
        />

        <StatCard
          title="Pending Approvals"
          subtitle="/ Verification"
          value={stats.pendingServices}
          change={stats.pendingServices > 0 ? "Needs Action" : "Clear"}
          changeType={stats.pendingServices > 0 ? "negative" : "positive"}
          changeLabel="items to process"
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
                    strokeDashoffset={getStrokeDashoffset(approvalsPercentage)}
                  />
                </svg>
                <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>
          }
        />

        <StatCard
          title="Open Reports"
          subtitle="/ System Flags"
          value={stats.reports}
          change={stats.reports > 0 ? "Review needed" : "Secured"}
          changeType={stats.reports > 0 ? "negative" : "positive"}
          changeLabel="unresolved flags"
          rightElement={
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-9 h-9 flex items-center justify-center text-red-500">
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
                    className="stroke-red-500 transition-all duration-500"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray="88"
                    strokeDashoffset={
                      stats.reports > 0
                        ? getStrokeDashoffset(reportPercentage)
                        : 88
                    }
                  />
                </svg>
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              </div>
            </div>
          }
        />
      </div>

      {/* Main Listing View Block */}
      <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold font-heading text-foreground tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 stroke-[2.5]" />
            Pending Service Approvals
          </h2>
          <Link
            href="/admin/approvals"
            className="text-xs font-bold font-heading text-primary hover:underline flex items-center gap-1 tracking-wide uppercase"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse bg-muted" />
            ))}
          </div>
        ) : pendingServices.length === 0 ? (
          <div className="text-center py-10">
            <CheckSquare className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">
              All caught up! No pending approvals.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate font-heading leading-tight">
                    {service.title}
                  </p>
                  <p className="text-xs text-muted-foreground/80 font-medium mt-1">
                    By {(service as any).profiles?.full_name} ·{" "}
                    <span className="text-foreground font-semibold">
                      GH₵{service.price}
                    </span>{" "}
                    · {service.category}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground/70">
                    {format(new Date(service.created_at), "MMM d")}
                  </span>
                  <Button
                    size="sm"
                    asChild
                    className="rounded-xl shadow-primary font-heading font-semibold text-xs h-8 px-4"
                  >
                    <Link href={`/admin/approvals?service=${service.id}`}>
                      Review
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
