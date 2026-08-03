"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

// Use the same Booking type as the parent
type Booking = {
  id: string;
  status: string;
  total_amount?: number | string | null;
  client_id: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null } | null;
  services?: { title: string } | null;
};

interface RecentOrdersProps {
  orders: Booking[];
  loading: boolean;
  statusMap: Record<string, { label: string; style: string }>;
}

export function RecentOrders({
  orders,
  loading,
  statusMap,
}: RecentOrdersProps) {
  return (
    <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold font-heading text-foreground tracking-tight">
          Recent Orders
        </h2>
        <Link
          href="/provider/orders"
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
      ) : orders.length === 0 ? (
        <div className="text-center py-10">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">
            No orders yet
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 font-heading"
            asChild
          >
            <Link href="/provider/create">Create your first service</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusMap[order.status] || statusMap.pending;
            return (
              <div
                key={order.id}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors"
              >
                <UserAvatar
                  name={order.profiles?.full_name}
                  avatarUrl={order.profiles?.avatar_url}
                  fallbackText="S"
                  className="w-10 h-10 flex-shrink-0"
                  fallbackClassName="bg-primary/10 text-primary text-xs font-bold"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate font-heading leading-tight">
                    {order.services?.title || "Service"}
                  </p>
                  <p className="text-xs text-muted-foreground/80 font-medium mt-1">
                    {order.profiles?.full_name || "Unknown student"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                  <span
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-md font-bold tracking-wide uppercase",
                      status.style,
                    )}
                  >
                    {status.label}
                  </span>
                  <p className="text-xs font-black text-foreground font-heading">
                    GH₵{Number(order.total_amount || 0).toFixed(0)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
