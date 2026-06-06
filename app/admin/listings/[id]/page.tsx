"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  X,
  Archive,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Tag,
  Banknote,
  ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string };
};

export default function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchServiceDetail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*, profiles:provider_id(full_name)")
        .eq("id", resolvedParams.id)
        .single();

      if (error) {
        toast.error("Failed to load listing details");
        router.push("/admin/listings");
      } else {
        setService(data as Service);
      }
    } catch {
      toast.error("An error occurred loading detail view");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceDetail();
  }, [resolvedParams.id]);

  const updateStatus = async (
    status: "approved" | "rejected" | "archived",
    reason = "",
  ) => {
    if (!service) return;
    setSubmitting(true);

    const payload: Record<string, any> = { status };
    if (status === "rejected") payload.rejection_reason = reason;

    const { error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", service.id);

    if (!error) {
      setService((prev) =>
        prev ? { ...prev, status, rejection_reason: reason } : null,
      );
      toast.success(`Listing status updated to ${status}`);
      setShowRejectDialog(false);
      setRejectionReason("");
    } else {
      toast.error(error.message || "Failed to update status");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 animate-pulse">
        <div className="h-6 w-24 bg-muted rounded-lg" />
        <div className="h-[300px] w-full bg-muted rounded-2xl" />
        <div className="h-10 w-2/3 bg-muted rounded-xl" />
        <div className="h-20 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  if (!service) return null;

  const primaryImage =
    service.images && service.images.length > 0 ? service.images[0] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <Link
        href="/admin/listings"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {service.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />{" "}
                {service.profiles?.full_name ?? "Unknown"}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 capitalize" /> {service.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />{" "}
                {service.created_at
                  ? format(new Date(service.created_at), "PPP")
                  : "Unknown Date"}
              </span>
            </div>
          </div>

          <div className="relative aspect-video w-full rounded-2xl border border-border bg-muted overflow-hidden shadow-inner">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <ImageIcon className="w-12 h-12 stroke-[1.5]" />
                <p className="text-xs font-medium">
                  No media banner uploaded for this listing
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Service Description
            </h3>
            <div className="p-5 rounded-2xl bg-card border border-border text-sm text-foreground/90 whitespace-pre-line leading-relaxed shadow-sm">
              {service.description ||
                "No descriptive text has been added to this system listing details entry."}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-6">
            <h3 className="font-bold text-sm text-foreground">
              Moderation Control Desk
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Listing Price
                </span>
                <span className="text-base font-bold text-primary flex items-center gap-1">
                  <Banknote className="w-4 h-4 text-emerald-600" /> GH₵
                  {service.price}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Current Status
                </span>
                <span
                  className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-bold capitalize",
                    service.status === "pending" &&
                      "bg-amber-100 text-amber-700",
                    service.status === "approved" &&
                      "bg-emerald-100 text-emerald-700",
                    service.status === "rejected" &&
                      "bg-rose-100 text-rose-700",
                    service.status === "archived" &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {service.status}
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

            <div className="space-y-2 pt-2">
              {service.status === "pending" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl h-10 font-medium text-xs"
                    disabled={submitting}
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <X className="w-4 h-4 mr-1.5" /> Reject
                  </Button>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl h-10 font-medium text-xs"
                    disabled={submitting}
                    onClick={() => updateStatus("approved")}
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
                  onClick={() => updateStatus("archived")}
                >
                  <Archive className="w-4 h-4 mr-1.5" /> Archive Active Listing
                </Button>
              )}

              {(service.status === "archived" ||
                service.status === "rejected") && (
                <Button
                  variant="outline"
                  className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl h-10 font-medium text-xs"
                  disabled={submitting}
                  onClick={() => updateStatus("approved")}
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" /> Reactivate Listing
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => !open && setShowRejectDialog(false)}
      >
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
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl shadow-sm"
              disabled={!rejectionReason.trim() || submitting}
              onClick={() => updateStatus("rejected", rejectionReason)}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
