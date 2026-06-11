"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ImageIcon, Eye, Archive, Check, X, RefreshCw } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Service, STATUS_STYLES } from "./types";

interface ModerationTableRowProps {
  service: Service;
  submittingAction: string | null;
  onApprove: (id: string) => void;
  onArchive: (id: string) => void;
  onInitiateReject: (id: string) => void;
}

export function ModerationTableRow({
  service,
  submittingAction,
  onApprove,
  onArchive,
  onInitiateReject,
}: ModerationTableRowProps) {
  const primaryImage =
    Array.isArray(service.images) && service.images.length > 0
      ? service.images[0]
      : null;

  const isActionDisabled = submittingAction !== null;

  return (
    <TableRow className="hover:bg-muted/10 transition-colors">
      <TableCell className="align-middle">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt="Listing Thumbnail"
            className="w-12 h-12 rounded-xl object-cover border border-border"
            onError={(e) => {
              e.currentTarget.src = "";
              e.currentTarget.className = "hidden";
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium max-w-sm">
        <div className="space-y-0.5">
          <p className="font-semibold text-sm text-foreground truncate">
            {service.title || "Untitled Service"}
          </p>
          <div className="flex gap-2 text-[11px] text-muted-foreground capitalize">
            <span>{service.category || "Uncategorized"}</span>
            <span>•</span>
            <span>
              {service.created_at
                ? format(new Date(service.created_at), "PP")
                : "N/A"}
            </span>
          </div>
          {service.status === "rejected" && service.rejection_reason && (
            <p className="text-[11px] text-rose-500 font-medium truncate mt-1">
              Reason: {service.rejection_reason}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {service.profiles?.full_name ?? "Unknown Provider"}
      </TableCell>
      <TableCell className="text-sm font-semibold text-foreground">
        GH₵{service.price}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize tracking-wide inline-block",
            STATUS_STYLES[service.status || "pending"],
          )}
        >
          {service.status || "pending"}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          {service.status === "pending" && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50"
                disabled={isActionDisabled}
                onClick={() => onInitiateReject(service.id)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isActionDisabled}
                onClick={() => onApprove(service.id)}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          {service.status === "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-muted-foreground"
              disabled={isActionDisabled}
              onClick={() => onArchive(service.id)}
            >
              <Archive className="w-3.5 h-3.5 mr-1" /> Archive
            </Button>
          )}

          {(service.status === "archived" || service.status === "rejected") && (
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              disabled={isActionDisabled}
              onClick={() => onApprove(service.id)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-lg"
            asChild
          >
            <Link href={`/admin/listings/${service.id}`}>
              <Eye className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
