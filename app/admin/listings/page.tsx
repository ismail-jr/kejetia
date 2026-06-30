"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Service } from "./components/types";
import { ModerationHeader } from "./components/moderation-header";
import { ModerationToolbar } from "./components/moderation-toolbar";
import { ModerationTableRow } from "./components/moderation-table-row";
import { RejectionDialog } from "./components/rejection-dialog";

export default function AdminListingsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [rejectingServiceId, setRejectingServiceId] = useState<string | null>(
    null,
  );
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;
      if (!servicesData || servicesData.length === 0) {
        setServices([]);
        return;
      }

      const providerUserIds = Array.from(
        new Set(servicesData.map((s) => s.provider_id)),
      );

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", providerUserIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map<string, string>();
      profilesData?.forEach((p) => {
        if (p.user_id && p.full_name) profileMap.set(p.user_id, p.full_name);
      });

      const stitchedData: Service[] = servicesData.map((service) => {
        const hasMatch = profileMap.has(service.provider_id);
        return {
          ...service,
          profiles: hasMatch
            ? { full_name: profileMap.get(service.provider_id)! }
            : { full_name: "Unknown Provider" },
        };
      });

      setServices(stitchedData);
    } catch (err: any) {
      toast.error(
        err?.message || "An unexpected error occurred while loading listings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "rejected" | "archived",
    reason = "",
  ) => {
    setSubmittingAction(id);
    const updatePayload: {
      status: "approved" | "rejected" | "archived";
      rejection_reason?: string;
    } = { status };
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
    } else {
      toast.error(error.message || "Failed to update listing status");
    }
    setSubmittingAction(null);
  };

  const filteredServices = services.filter((s) => {
    const searchString = search.toLowerCase().trim();
    const matchesFilter = filter === "all" || s.status === filter;

    if (!searchString) return matchesFilter;

    const titleMatch = s.title?.toLowerCase().includes(searchString) ?? false;
    const catMatch = s.category?.toLowerCase().includes(searchString) ?? false;
    const profileMatch =
      s.profiles?.full_name?.toLowerCase().includes(searchString) ?? false;

    return (titleMatch || catMatch || profileMatch) && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <ModerationHeader onRefresh={fetchServices} loading={loading} />

      <ModerationToolbar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

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
              {filteredServices.map((service) => (
                <ModerationTableRow
                  key={service.id}
                  service={service}
                  submittingAction={submittingAction}
                  onApprove={(id) => handleUpdateStatus(id, "approved")}
                  onArchive={(id) => handleUpdateStatus(id, "archived")}
                  onInitiateReject={(id) => setRejectingServiceId(id)}
                />
              ))}
            </TableBody>
          </Table>

          {filteredServices.length === 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-muted-foreground text-sm font-medium">
                No system listings match current filter configurations.
              </p>
            </div>
          )}
        </div>
      )}

      <RejectionDialog
        serviceId={rejectingServiceId}
        onClose={() => setRejectingServiceId(null)}
        onConfirm={(id, reason) => handleUpdateStatus(id, "rejected", reason)}
      />
    </div>
  );
}
