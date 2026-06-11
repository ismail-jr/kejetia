"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RejectionDialogProps {
  serviceId: string | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
}

export function RejectionDialog({
  serviceId,
  onClose,
  onConfirm,
}: RejectionDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");

  // Clear previous reasons when window state resets
  useEffect(() => {
    if (!serviceId) setRejectionReason("");
  }, [serviceId]);

  return (
    <Dialog open={!!serviceId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            Provide Rejection Explanation
          </DialogTitle>
          <DialogDescription className="text-xs">
            State why this submission violates UCC platform rules.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            id="reason"
            placeholder="e.g. Missing valid contact info or unacceptable parameters"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="rounded-xl h-10"
            maxLength={250}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl shadow-sm"
            disabled={!rejectionReason.trim()}
            onClick={() => serviceId && onConfirm(serviceId, rejectionReason)}
          >
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
