"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import {
  listProviderBookingsWithDetails,
  markBookingPaid,
  updateBookingStatus,
  type ProviderBookingOrder,
} from "@/lib/data/bookings";
import type { BookingStatus } from "@/lib/data/types";
import { OrderCard } from "./components/order-card";
import { OrderTabs, type TabType } from "./components/order-tabs";

export default function ProviderOrdersPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ProviderBookingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("active");

  const fetchOrders = useCallback(async () => {
    const currentProviderId = profile?.user_id;
    if (!currentProviderId) return;

    setLoading(true);
    try {
      const data = await listProviderBookingsWithDetails(currentProviderId);
      setOrders(data);
    } catch (error: unknown) {
      console.error("Error fetching provider orders:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load your orders.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateBookingStatus(orderId, status as BookingStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: status as BookingStatus } : o,
        ),
      );
      toast.success(`Order status updated to ${status.replace("_", " ")}!`);
    } catch (error: unknown) {
      console.error(error);
      toast.error("Could not update order state.");
    }
  };

  const markAsPaid = async (orderId: string) => {
    try {
      await markBookingPaid(orderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, payment_status: "paid" } : o,
        ),
      );
      toast.success("Payment marked as paid!");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Could not mark payment as paid.");
    }
  };

  const counts = useMemo(() => {
    let active = 0,
      completed = 0,
      cancelled = 0;
    orders.forEach((o) => {
      if (["pending", "confirmed", "in_progress"].includes(o.status)) active++;
      else if (o.status === "completed") completed++;
      else if (o.status === "cancelled") cancelled++;
    });
    return { active, completed, cancelled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab === "active")
        return ["pending", "confirmed", "in_progress"].includes(o.status);
      if (activeTab === "completed") return o.status === "completed";
      return o.status === "cancelled";
    });
  }, [orders, activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-1">
          Manage incoming service requests from students
        </p>
      </div>

      <OrderTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No {activeTab} orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={updateStatus}
              onMessageStudent={(clientId) =>
                router.push(`/provider/messages?with=${clientId}`)
              }
              onMarkAsPaid={markAsPaid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
