"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProviderOrder } from "./order-card";

interface DeclineOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: ProviderOrder;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

export function DeclineOrderDialog({
  isOpen,
  onOpenChange,
  order,
  onConfirm,
  isProcessing,
}: DeclineOrderDialogProps) {
  const amount = Number((order.total_amount ?? order.base_amount) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <X className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl">Decline Order?</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Are you sure you want to decline this order from{" "}
                <span className="font-semibold text-foreground">
                  {order.student?.full_name || "Student"}
                </span>
                ?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-muted/30 rounded-xl p-4 space-y-2 my-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium text-foreground">
              {order.services?.title || "Service"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Student</span>
            <span className="font-medium text-foreground">
              {order.student?.full_name || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium text-primary">
              GH₵ {amount.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="rounded-xl flex-1"
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isProcessing}
            className="rounded-xl flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Yes, Decline
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
