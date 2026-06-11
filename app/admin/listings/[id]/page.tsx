"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Service } from "../components/id-types";
import { DetailContent } from "../components/id-detail-content";
import { DetailRejectionDialog } from "../components/id-rejection-dialog";
import { ModerationSidebar } from "../components/id-moderation-sidebar";

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <Link
        href="/admin/listings"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <DetailContent service={service} />

        <div className="space-y-6">
          <ModerationSidebar
            service={service}
            submitting={submitting}
            onUpdateStatus={(status) => updateStatus(status)}
            onOpenRejectDialog={() => setShowRejectDialog(true)}
          />
        </div>
      </div>

      <DetailRejectionDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        submitting={submitting}
        onConfirm={(reason) => updateStatus("rejected", reason)}
      />
    </div>
  );
}
