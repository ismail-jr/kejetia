"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ClipboardList, MessageSquare, Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  student?: { full_name: string; avatar_url: string; email: string };
  services?: { title: string; category: string };
};

const STATUS_MAP: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-primary/10 text-primary",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const NEXT_STATUS: Record<string, string> = {
  pending: "confirmed",
  confirmed: "in_progress",
  in_progress: "completed",
};

export default function ProviderOrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "active" | "completed" | "cancelled"
  >("active");

  const fetchOrders = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("bookings")
      .select(
        `
        *,
        student:profiles!bookings_student_id_fkey(full_name, avatar_url, email),
        services(title, category)
      `,
      )
      .eq("provider_id", profile.id)
      .order("created_at", { ascending: false });
    if (data) setOrders(data as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [profile]);

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await (supabase.from("bookings") as any)
      .update({ status })
      .eq("id", orderId);
    if (!error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: status as any } : o,
        ),
      );
      toast.success(`Order ${status.replace("_", " ")}!`);
    }
  };

  const filtered = orders.filter((o) => {
    if (activeTab === "active")
      return ["pending", "confirmed", "in_progress"].includes(o.status);
    if (activeTab === "completed") return o.status === "completed";
    return o.status === "cancelled";
  });

  const TABS = [
    {
      key: "active",
      label: "Active",
      count: orders.filter((o) =>
        ["pending", "confirmed", "in_progress"].includes(o.status),
      ).length,
    },
    {
      key: "completed",
      label: "Completed",
      count: orders.filter((o) => o.status === "completed").length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: orders.filter((o) => o.status === "cancelled").length,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-1">
          Manage bookings from students
        </p>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No {activeTab} orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const initials =
              order.student?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) || "S";
            const nextStatus = NEXT_STATUS[order.status];
            return (
              <div
                key={order.id}
                className="bg-card rounded-2xl border border-border p-5"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={order.student?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {(order as any).services?.title}
                      </h3>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                          STATUS_MAP[order.status],
                        )}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.student?.full_name} · {order.student?.email}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        GH₵{Number(order.amount).toFixed(2)}
                      </span>
                      {order.booking_date && (
                        <span>
                          {format(
                            new Date(order.booking_date),
                            "MMM d, yyyy h:mm a",
                          )}
                        </span>
                      )}
                      <span>
                        Booked{" "}
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {order.notes && (
                      <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mt-2">
                        Note: {order.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                  {nextStatus && (
                    <Button
                      size="sm"
                      className="rounded-xl shadow-primary"
                      onClick={() => updateStatus(order.id, nextStatus)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Mark as {nextStatus.replace("_", " ")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      (location.href = `/provider/messages?with=${order.student_id}`)
                    }
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Message
                  </Button>
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl text-destructive"
                      onClick={() => updateStatus(order.id, "cancelled")}
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Decline
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
