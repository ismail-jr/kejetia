"use client";

import { format, parseISO } from "date-fns";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { BookingWithDetails } from "./booking-card";

interface CancelBookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails;
  onConfirm: () => Promise<void>;
  isCancelling: boolean;
}

export function CancelBookingDialog({
  isOpen,
  onOpenChange,
  booking,
  onConfirm,
  isCancelling,
}: CancelBookingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Cancel Booking?</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Are you sure you want to cancel this booking? This action cannot
                be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-muted/30 rounded-xl p-4 space-y-2 my-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium text-foreground">
              {booking.service?.title || "Service"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-medium text-foreground">
              {booking.provider?.full_name || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-foreground">
              {format(parseISO(booking.appointment_date), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-medium text-primary">
              GH₵ {Number(booking.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
            className="rounded-xl flex-1"
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isCancelling}
            className="rounded-xl flex-1"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Yes, Cancel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
