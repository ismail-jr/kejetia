"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { OrderCard, type ProviderOrder } from "./components/order-card";
import { OrderTabs, type TabType } from "./components/order-tabs";

export default function ProviderOrdersPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("active");

  const fetchOrders = useCallback(async () => {
    const currentProviderId = profile?.user_id;
    if (!currentProviderId) return;

    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("provider_id", currentProviderId)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookingsData || bookingsData.length === 0) {
        setOrders([]);
        return;
      }

      const clientIds = [
        ...new Set(bookingsData.map((b) => b.client_id)),
      ].filter(Boolean);
      const serviceIds = [
        ...new Set(bookingsData.map((b) => b.service_id)),
      ].filter(Boolean);

      let clientsData: any[] | null = [];
      if (clientIds.length > 0) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, avatar_url, email");
        if (error) throw error;
        clientsData = data;
      }

      let servicesData: any[] | null = [];
      if (serviceIds.length > 0) {
        const { data, error } = await supabase
          .from("services")
          .select("id, title, category, price, images")
          .in("id", serviceIds);
        if (error) throw error;
        servicesData = data;
      }

      const clientsMap = new Map();
      clientsData?.forEach((client) => {
        if (client.user_id) clientsMap.set(client.user_id, client);
        if (client.id) clientsMap.set(client.id, client);
      });

      const servicesMap = new Map();
      servicesData?.forEach((service) => {
        servicesMap.set(service.id, service);
      });

      const combinedData: ProviderOrder[] = bookingsData.map(
        (booking: any) => ({
          id: booking.id,
          created_at: booking.created_at,
          client_id: booking.client_id,
          provider_id: booking.provider_id,
          service_id: booking.service_id,
          status: booking.status,
          notes: booking.notes,
          total_amount: booking.total_amount ?? booking.amount,
          base_amount: booking.base_amount ?? booking.price,
          appointment_date: booking.appointment_date ?? booking.date,
          appointment_time: booking.appointment_time ?? booking.time,
          payment_status: booking.payment_status || "unpaid",
          student: clientsMap.get(booking.client_id) || null,
          services: servicesMap.get(booking.service_id) || null,
        }),
      );

      setOrders(combinedData);
    } catch (error: any) {
      console.error(
        "❌ Error compiling user orders map payload arrays:",
        error,
      );
      toast.error(error?.message || "Failed to compile your orders list.");
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: status as ProviderOrder["status"] }
            : o,
        ),
      );
      toast.success(`Order status updated to ${status.replace("_", " ")}!`);
    } catch (error: any) {
      console.error(error);
      toast.error("Could not update order state.");
    }
  };

  const markAsPaid = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, payment_status: "paid" } : o,
        ),
      );
      toast.success("Payment marked as paid! 💰");
    } catch (error: any) {
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
