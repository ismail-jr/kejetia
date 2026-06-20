"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { MessageSquare, X, Calendar, MapPin, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
import { CancelBookingDialog } from "./cancel-booking";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface BookingWithDetails {
  id: string;
  service_id: string;
  client_id: string;
  provider_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  appointment_date: string;
  appointment_time: string;
  base_amount: string;
  total_amount: string;
  payment_status: string;
  payment_term: string;
  service?: Service | null;
  provider?: Pick<Profile, "full_name" | "avatar_url" | "location"> | null;
}

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
    style: "bg-destructive/10 text-destructive",
  },
};

interface BookingCardProps {
  booking: BookingWithDetails;
  onCancel: (id: string) => Promise<void>;
  onOpenReview: (booking: BookingWithDetails) => void;
}

export function BookingCard({
  booking,
  onCancel,
  onOpenReview,
}: BookingCardProps) {
  const router = useRouter();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const status = STATUS_MAP[booking.status] || STATUS_MAP.pending;
  const serviceImage = booking.service?.images?.[0];
  const rawRating = Number(booking.service?.avg_rating || 0);
  const hasRating = rawRating > 0;
  const reviewCount = booking.service?.total_reviews || 0;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(booking.id);
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling booking:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row">
        {/* COLUMN 1: LEFT MEDIA AREA */}
        <div className="relative w-full md:w-[260px] h-[180px] md:h-auto bg-muted flex-shrink-0">
          {serviceImage ? (
            <img
              src={serviceImage}
              alt={booking.service?.title || "Service"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              <Calendar className="w-8 h-8 opacity-40" />
            </div>
          )}
          {booking.service?.images && booking.service.images.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded font-medium">
              1/{booking.service.images.length}
            </span>
          )}
        </div>

        {/* COLUMN 2: CENTER SUMMARY CONTENT */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-4 border-b md:border-b-0 md:border-r border-border/50">
          <div className="space-y-2">
            <h3 className="font-bold text-foreground text-xl tracking-tight leading-snug line-clamp-2">
              {booking.service?.title || "Service Session"}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{booking.provider?.location || "Main Campus"}</span>
              </div>
              <span aria-hidden>•</span>
              <span className="capitalize">
                {booking.service?.category || "Provider Services"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-border/40">
            <div
              className={cn(
                "font-bold text-sm px-2.5 py-1.5 rounded-lg flex items-center justify-center min-w-[36px]",
                hasRating
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {hasRating ? rawRating.toFixed(1) : "—"}
            </div>
            <div className="text-xs">
              <p className="font-bold text-foreground leading-none mb-0.5">
                {!hasRating
                  ? "New"
                  : rawRating >= 4.5
                    ? "Outstanding"
                    : "Great"}
              </p>
              <p className="text-muted-foreground leading-none">
                {hasRating
                  ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 3: RIGHT PRICING & ACTIONS */}
        <div className="w-full md:w-[240px] bg-muted/30 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-semibold text-primary">Total price</p>
                <p className="text-muted-foreground text-[10px] capitalize">
                  {booking.payment_status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary font-extrabold text-base leading-tight">
                  GH₵ {Number(booking.total_amount).toFixed(0)}
                </p>
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase inline-block mt-1",
                    status.style,
                  )}
                >
                  {status.label}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 px-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Date</span>
                <span className="text-foreground font-medium">
                  {format(parseISO(booking.appointment_date), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Time slot</span>
                <span className="text-foreground font-medium truncate max-w-[120px]">
                  {booking.appointment_time}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Term</span>
                <span className="text-foreground font-medium capitalize">
                  {booking.payment_term.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full rounded-xl shadow-sm font-medium text-xs h-9"
              onClick={() =>
                router.push(`/student/messages?with=${booking.provider_id}`)
              }
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Message Provider
            </Button>

            <div className="flex gap-1.5">
              {booking.status === "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-xl text-xs h-8 bg-card"
                  onClick={() => onOpenReview(booking)}
                >
                  <Star className="w-3 h-3 mr-1 text-amber-500 fill-amber-500" />
                  Review
                </Button>
              )}

              {["pending", "confirmed"].includes(booking.status) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full rounded-xl text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsCancelDialogOpen(true)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              )}

              {/* Provider Name Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Provider details"
                      className="rounded-xl px-2 h-8 text-muted-foreground bg-card flex-shrink-0"
                    >
                      <User className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium text-sm">
                      {booking.provider?.full_name || "Unknown Provider"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <CancelBookingDialog
        isOpen={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        booking={booking}
        onConfirm={handleCancel}
        isCancelling={isCancelling}
      />
    </>
  );
}
