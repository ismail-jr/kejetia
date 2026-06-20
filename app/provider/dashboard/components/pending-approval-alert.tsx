"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingApprovalAlertProps {
  count: number;
}

export function PendingApprovalAlert({ count }: PendingApprovalAlertProps) {
  if (count === 0) return null;

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
      <p className="text-sm font-medium text-warning">
        You have {count} service{count > 1 ? "s" : ""} awaiting admin approval.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="ml-auto border-warning/30 text-warning hover:bg-warning/10 font-heading text-xs font-bold"
        asChild
      >
        <Link href="/provider/services">View</Link>
      </Button>
    </div>
  );
}
