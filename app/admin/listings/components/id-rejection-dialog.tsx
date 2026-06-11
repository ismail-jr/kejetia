"use client";

import { useState, useEffect } from "react";
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

interface DetailRejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  submitting: boolean;
}

export function DetailRejectionDialog({
  isOpen,
  onClose,
  onConfirm,
  submitting,
}: DetailRejectionDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!isOpen) setRejectionReason("");
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            Provide Rejection Explanation
          </DialogTitle>
          <DialogDescription className="text-xs">
            Explain why this listing is being rejected. The provider will see
            this feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            placeholder="e.g. Broken links, duplicate entry, invalid images"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="rounded-xl h-10"
            maxLength={250}
          />
        </div>
        <DialogFooter>
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
            disabled={!rejectionReason.trim() || submitting}
            onClick={() => onConfirm(rejectionReason)}
          >
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
