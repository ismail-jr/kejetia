"use client";

import {
  Banknote,
  AlertCircle,
  X,
  Check,
  Archive,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Service } from "./types";

interface ModerationSidebarProps {
  service: Service;
  submitting: boolean;
  onUpdateStatus: (status: "approved" | "archived") => void;
  onOpenRejectDialog: () => void;
}

export function ModerationSidebar({
  service,
  submitting,
  onUpdateStatus,
  onOpenRejectDialog,
}: ModerationSidebarProps) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
      <h3 className="font-bold text-sm text-foreground">
        Moderation Control Desk
      </h3>

      <div className="space-y-4">
        {/* Database Pricing Field Breakdown */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-medium text-muted-foreground">
            Listing Valuation
          </span>
          <span className="text-base font-bold text-foreground flex items-center gap-1">
            <Banknote className="w-4 h-4 text-emerald-600" /> GH₵{service.price}
          </span>
        </div>

        {/* Pricing Type Model Display */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-medium text-muted-foreground">
            Pricing Rate Model
          </span>
          <span className="text-xs font-bold capitalize text-muted bg-secondary px-2.5 py-1 rounded-md">
            {service.pricing_type?.replace("_", " ") || "Fixed"}
          </span>
        </div>

        {/* Status Display Badge */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-medium text-muted-foreground">
            Current Status
          </span>
          <span
            className={cn(
              "text-xs px-2.5 py-0.5 rounded-full font-bold capitalize",
              service.status === "pending" && "bg-amber-100 text-amber-700",
              service.status === "approved" &&
                "bg-emerald-100 text-emerald-700",
              service.status === "rejected" && "bg-rose-100 text-rose-700",
              service.status === "archived" && "bg-muted text-muted-foreground",
              !service.status && "bg-amber-100 text-amber-700",
            )}
          >
            {service.status || "pending"}
          </span>
        </div>
      </div>

      {service.status === "rejected" && service.rejection_reason && (
        <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-rose-600">
              Rejection Reason
            </p>
            <p className="text-xs text-rose-600/90 italic">
              "{service.rejection_reason}"
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Status Updating Block Controls */}
      <div className="space-y-2 pt-2">
        {(service.status === "pending" || !service.status) && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl h-10 font-medium text-xs"
              disabled={submitting}
              onClick={onOpenRejectDialog}
            >
              <X className="w-4 h-4 mr-1.5" /> Reject
            </Button>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl h-10 font-medium text-xs"
              disabled={submitting}
              onClick={() => onUpdateStatus("approved")}
            >
              <Check className="w-4 h-4 mr-1.5" /> Approve
            </Button>
          </div>
        )}

        {service.status === "approved" && (
          <Button
            variant="outline"
            className="w-full text-muted-foreground hover:text-foreground rounded-xl h-10 font-medium text-xs"
            disabled={submitting}
            onClick={() => onUpdateStatus("archived")}
          >
            <Archive className="w-4 h-4 mr-1.5" /> Archive Active Listing
          </Button>
        )}

        {(service.status === "archived" || service.status === "rejected") && (
          <Button
            variant="outline"
            className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl h-10 font-medium text-xs"
            disabled={submitting}
            onClick={() => onUpdateStatus("approved")}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Reactivate Listing
          </Button>
        )}
      </div>
    </div>
  );
}
