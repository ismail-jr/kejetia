"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  ClipboardList,
  MessageSquare,
  Check,
  X,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  CreditCard,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { ProviderBookingOrder } from "@/lib/data/bookings";
import { DeclineOrderDialog } from "./decline-dialog";

export type ProviderOrder = ProviderBookingOrder & {
  /** @deprecated Use `client` from ProviderBookingOrder */
  student?: ProviderBookingOrder["client"];
  /** @deprecated Use `service` from ProviderBookingOrder */
  services?: ProviderBookingOrder["service"];
};

interface OrderCardProps {
  order: ProviderOrder;
  onUpdateStatus: (orderId: string, status: string) => void;
  onMessageStudent: (clientId: string) => void;
  onMarkAsPaid?: (orderId: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<any>; color: string }
> = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    color:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
  },
  confirmed: {
    label: "Confirmed",
    icon: Check,
    color:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  completed: {
    label: "Completed",
    icon: Check,
    color:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: X,
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

const NEXT_STATUS: Record<string, { label: string; action: string }> = {
  pending: { label: "Confirm", action: "confirmed" },
  confirmed: { label: "Start Work", action: "in_progress" },
  in_progress: { label: "Complete", action: "completed" },
};

export function OrderCard({
  order,
  onUpdateStatus,
  onMessageStudent,
  onMarkAsPaid,
}: OrderCardProps) {
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const student = order.client ?? order.student;
  const service = order.service ?? order.services;

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const nextStep = NEXT_STATUS[order.status];
  const amount = Number((order.total_amount ?? order.base_amount) || 0);
  const isStatusLoading = order.status === "in_progress";
  const isPaid = order.payment_status === "paid";

  const handleUpdateStatus = async (status: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = async () => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, "cancelled");
      setIsDeclineDialogOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsMarkingPaid(true);
    try {
      if (onMarkAsPaid) {
        await onMarkAsPaid(order.id);
      }
    } finally {
      setIsMarkingPaid(false);
    }
  };

  return (
    <>
      <div className="group bg-card rounded-2xl border border-border/60 hover:border-primary/20 hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            {/* Thumbnail */}
            <div className="relative w-full lg:w-[180px] h-[140px] lg:h-[160px] bg-muted rounded-xl overflow-hidden flex-shrink-0">
              {service?.images && service.images.length > 0 ? (
                <img
                  src={service.images[0]}
                  alt={service?.title || "Service Thumbnail"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-primary">
                  <ClipboardList className="w-10 h-10 opacity-40" />
                  <span className="text-xs text-muted-foreground mt-2">
                    No image
                  </span>
                </div>
              )}

              {/* Status Badge on Image */}
              <div className="absolute top-3 right-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm bg-white/90 dark:bg-black/90",
                    statusConfig.color,
                    isStatusLoading && "animate-pulse",
                  )}
                >
                  <StatusIcon
                    className={cn("w-3 h-3", isStatusLoading && "animate-spin")}
                  />
                  {statusConfig.label}
                </span>
              </div>

              {/* Payment Status Badge */}
              <div className="absolute bottom-3 right-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm",
                    isPaid
                      ? "bg-green-500/90 text-white"
                      : "bg-amber-500/90 text-white",
                  )}
                >
                  {isPaid ? (
                    <>
                      <Check className="w-2.5 h-2.5" />
                      Paid
                    </>
                  ) : (
                    <>
                      <Clock className="w-2.5 h-2.5" />
                      Unpaid
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Details Body */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Title & Price */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-1">
                    {service?.title || "Requested Service"}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1.5">
                    {/* Enhanced Avatar with ring */}
                    <div className="relative">
                      <UserAvatar
                        name={student?.full_name}
                        avatarUrl={student?.avatar_url}
                        fallbackText="S"
                        className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                        imageClassName="object-cover"
                        fallbackClassName="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-sm"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground/90 leading-tight">
                        {student?.full_name || "Unknown Student"}
                      </span>
                      <span className="text-xs text-muted-foreground/70">
                        {student?.email || "No email"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="font-bold text-primary text-lg">
                    GH₵ {amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
                {order.appointment_date && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg cursor-help">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {format(
                              parseISO(order.appointment_date.split("T")[0]),
                              "MMM d, yyyy",
                            )}
                          </span>
                          <span className="text-muted-foreground/60">·</span>
                          <span>{order.appointment_time || "TBD"}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Scheduled appointment date & time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Received {format(parseISO(order.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  <span
                    className={isPaid ? "text-green-600" : "text-amber-600"}
                  >
                    {isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-transparent border-l-4 border-amber-400 rounded-r-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      📝 Note:
                    </span>{" "}
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/50">
            {nextStep && order.status !== "cancelled" && (
              <Button
                size="sm"
                className="rounded-xl shadow-sm hover:shadow-md transition-all"
                onClick={() => handleUpdateStatus(nextStep.action)}
                disabled={isUpdating || isMarkingPaid}
              >
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isUpdating ? "Updating..." : nextStep.label}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all"
              onClick={() => onMessageStudent(order.client_id)}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Message Student
            </Button>

            {/* Mark as Paid Button - Only show for completed orders that are unpaid */}
            {order.status === "completed" && !isPaid && onMarkAsPaid && (
              <Button
                size="sm"
                variant="default"
                className="rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all"
                onClick={handleMarkAsPaid}
                disabled={isMarkingPaid || isUpdating}
              >
                {isMarkingPaid ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isMarkingPaid ? "Processing..." : "Mark as Paid"}
              </Button>
            )}

            {order.status === "pending" && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                onClick={() => setIsDeclineDialogOpen(true)}
                disabled={isUpdating || isMarkingPaid}
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Decline
              </Button>
            )}

            {order.status === "completed" && isPaid && (
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  Order Complete • Paid
                </span>
              </div>
            )}

            {order.status === "completed" && !isPaid && (
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Awaiting Payment
                </span>
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <X className="w-4 h-4 text-destructive" />
                <span className="font-medium text-destructive">Cancelled</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decline Confirmation Dialog */}
      <DeclineOrderDialog
        isOpen={isDeclineDialogOpen}
        onOpenChange={setIsDeclineDialogOpen}
        order={order}
        onConfirm={handleDecline}
        isProcessing={isUpdating}
      />
    </>
  );
}
