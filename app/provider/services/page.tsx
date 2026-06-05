"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Archive,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    style: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending Review",
    style:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    style:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    style: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
  archived: {
    label: "Archived",
    style: "bg-muted text-muted-foreground",
    icon: Archive,
  },
};

const PEXELS_FALLBACK =
  "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=400";

export default function ProviderServicesPage() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "approved" | "pending" | "rejected"
  >("all");

  const fetchServices = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("provider_id", profile.id)
      .order("created_at", { ascending: false });
    if (data) setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, [profile]);

  const handleArchive = async (id: string) => {
    const { error } = await supabase
      .from("services")
      .update({ status: "archived" })
      .eq("id", id);
    if (!error) {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "archived" } : s)),
      );
      toast.success("Service archived");
    }
  };

  const filtered =
    filter === "all" ? services : services.filter((s) => s.status === filter);

  const tabs = [
    { key: "all", label: "All", count: services.length },
    {
      key: "approved",
      label: "Approved",
      count: services.filter((s) => s.status === "approved").length,
    },
    {
      key: "pending",
      label: "Pending",
      count: services.filter((s) => s.status === "pending").length,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: services.filter((s) => s.status === "rejected").length,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your service listings
          </p>
        </div>
        <Button asChild className="shadow-primary">
          <Link href="/provider/create">
            <Plus className="mr-2 w-4 h-4" />
            New Service
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {count > 0 && (
              <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-semibold text-foreground mb-2">
            No services here
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {filter === "all"
              ? "Create your first service listing to get started."
              : `No ${filter} services.`}
          </p>
          {filter === "all" && (
            <Button asChild className="shadow-primary">
              <Link href="/provider/create">
                <Plus className="mr-2 w-4 h-4" />
                Create Service
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((service) => {
            const statusConfig =
              STATUS_CONFIG[service.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const imageUrl = service.images?.[0] || PEXELS_FALLBACK;

            return (
              <div
                key={service.id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover transition-all"
              >
                <div className="relative h-40 bg-muted">
                  <img
                    src={imageUrl}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5",
                        statusConfig.style,
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                    {service.title}
                  </h3>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-foreground">
                      GH₵{service.price}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {service.avg_rating > 0
                        ? service.avg_rating.toFixed(1)
                        : "New"}
                      <span className="ml-1">
                        · {service.total_bookings} bookings
                      </span>
                    </div>
                  </div>
                  {service.rejection_reason && (
                    <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-2.5 py-2 mt-2">
                      Rejected: {service.rejection_reason}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {service.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl flex-1"
                        asChild
                      >
                        <Link href={`/student/services/${service.id}`}>
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl flex-1"
                      asChild
                    >
                      <Link href={`/provider/services/${service.id}/edit`}>
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    {service.status !== "archived" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl text-muted-foreground"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Archive this service?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This service will be hidden from students. You can
                              unarchive it later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleArchive(service.id)}
                            >
                              Archive
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
