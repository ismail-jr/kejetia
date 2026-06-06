"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Archive,
  Check,
  X,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string };
};

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30",
  rejected:
    "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/30",
  archived: "bg-muted text-muted-foreground border border-border/40",
};

export default function AdminListingsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [rejectingServiceId, setRejectingServiceId] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*, profiles:provider_id(full_name)")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load listings data");
      } else if (data) {
        setServices(data as Service[]);
      }
    } catch {
      toast.error("An unexpected error occurred while loading listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "rejected" | "archived",
    reason = "",
  ) => {
    setSubmittingAction(id);
    const updatePayload: Record<string, any> = { status };
    if (status === "rejected") {
      updatePayload.rejection_reason = reason;
    }

    const { error } = await supabase
      .from("services")
      .update(updatePayload)
      .eq("id", id);

    if (!error) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status, rejection_reason: reason } : s,
        ),
      );
      toast.success(`Listing successfully marked as ${status}`);
      setRejectingServiceId(null);
      setRejectionReason("");
    } else {
      toast.error(error.message || "Failed to update listing status");
    }
    setSubmittingAction(null);
  };

  const filtered = services.filter((s) => {
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            System Moderation
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Review, approve, reject or archive platform service items
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchServices}
          className="rounded-xl gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Force Reload
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, category, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <div className="flex flex-wrap gap-1 bg-muted rounded-xl p-1 shrink-0">
          {["all", "pending", "approved", "rejected", "archived"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150",
                filter === s
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-muted/40 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px]">Item</TableHead>
                <TableHead>Listing Details</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((service) => {
                const primaryImage =
                  service.images && service.images.length > 0
                    ? service.images[0]
                    : null;

                return (
                  <TableRow
                    key={service.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="align-middle">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-border"
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
                          {service.title}
                        </p>
                        <div className="flex gap-2 text-[11px] text-muted-foreground capitalize">
                          <span>{service.category}</span>
                          <span>•</span>
                          <span>
                            {service.created_at
                              ? format(new Date(service.created_at), "PP")
                              : "N/A"}
                          </span>
                        </div>
                        {service.status === "rejected" &&
                          service.rejection_reason && (
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
                          STATUS_STYLES[service.status],
                        )}
                      >
                        {service.status}
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
                              disabled={submittingAction !== null}
                              onClick={() => setRejectingServiceId(service.id)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={submittingAction !== null}
                              onClick={() =>
                                handleUpdateStatus(service.id, "approved")
                              }
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
                            disabled={submittingAction !== null}
                            onClick={() =>
                              handleUpdateStatus(service.id, "archived")
                            }
                          >
                            <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                          </Button>
                        )}

                        {(service.status === "archived" ||
                          service.status === "rejected") && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            disabled={submittingAction !== null}
                            onClick={() =>
                              handleUpdateStatus(service.id, "approved")
                            }
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
              })}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-muted-foreground text-sm font-medium">
                No system listings match current filter configurations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* REJECTION SUBMISSION REASON MODAL DIALOG */}
      <Dialog
        open={!!rejectingServiceId}
        onOpenChange={(open) => !open && setRejectingServiceId(null)}
      >
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
              onClick={() => setRejectingServiceId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl shadow-sm"
              disabled={!rejectionReason.trim()}
              onClick={() =>
                rejectingServiceId &&
                handleUpdateStatus(
                  rejectingServiceId,
                  "rejected",
                  rejectionReason,
                )
              }
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
