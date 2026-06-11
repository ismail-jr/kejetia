"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceStats } from "./components/service-stats";
import type { Database } from "@/lib/database.types";
import { ProviderServiceCard } from "./components/service-card";
import { EditServiceModal } from "./components/edit-modal";

type Service = Database["public"]["Tables"]["services"]["Row"];
type FilterType = "all" | "approved" | "pending" | "rejected" | "archived";

interface EditFormState {
  id?: string;
  title: string;
  description: string;
  category: string;
  pricing_type: "fixed" | "hourly" | "negotiable";
  price: number;
  tags: string[];
  images: string[];
  status?: string;
}

export default function ProviderServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    title: "",
    description: "",
    category: "",
    pricing_type: "fixed",
    price: 0,
    tags: [],
    images: [],
  });

  const fetchServices = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setServices(data);
    } catch (error) {
      console.error("Fetch data exception:", error);
      toast.error("Could not fetch your services data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleArchive = async (id: string) => {
    const { error } = await supabase
      .from("services")
      .update({ status: "archived" })
      .eq("id", id);

    if (!error) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "archived" as const } : s,
        ),
      );
      toast.success("Service archived");
    } else {
      toast.error("Failed to archive service");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service deleted permanently");
    } else {
      toast.error("Failed to delete service");
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setEditForm({
      id: service.id,
      title: service.title,
      description: service.description || "",
      category: service.category,
      pricing_type: (service.pricing_type as any) || "fixed",
      price: service.price,
      tags: service.tags || [],
      images: service.images || [],
      status: service.status,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (updatedImages?: string[]) => {
    if (!editingService) return;
    setEditing(true);

    try {
      const finalImages = updatedImages || editForm.images;

      const { data, error } = await supabase
        .from("services")
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          pricing_type: editForm.pricing_type,
          price: editForm.price,
          tags: editForm.tags,
          images: finalImages,
          updated_at: new Date().toISOString(),
          status: "pending",
        })
        .eq("id", editingService.id)
        .select()
        .single();

      if (error) throw error;

      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? data : s)),
      );
      toast.success("Service updated successfully! It will be reviewed again.");
      setEditDialogOpen(false);
      setEditingService(null);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update service listing");
    } finally {
      setEditing(false);
    }
  };

  const filtered =
    filter === "all" ? services : services.filter((s) => s.status === filter);

  const tabs = [
    { key: "all", label: "All", count: services.length },
    {
      key: "approved",
      label: "Approved",
      count: services.filter((s) => s.status === "approved").length,
    },
    {
      key: "pending",
      label: "Pending",
      count: services.filter((s) => s.status === "pending").length,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: services.filter((s) => s.status === "rejected").length,
    },
    {
      key: "archived",
      label: "Archived",
      count: services.filter((s) => s.status === "archived").length,
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your service listings for the campus community
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all"
        >
          <Link href="/provider/create">
            <Plus className="mr-2 w-4 h-4" /> New Service
          </Link>
        </Button>
      </div>

      {/* Reusable Dashboard Stats Row Component */}
      <ServiceStats services={services} />

      {/* Navigation Filter Controls */}
      <div className="flex flex-wrap gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {count > 0 && (
              <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl overflow-hidden">
              <div className="h-48 bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            No services found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {filter === "all"
              ? "Create your first service listing to get started."
              : `No ${filter} services available.`}
          </p>
          {filter === "all" && (
            <Button asChild>
              <Link href="/provider/create">
                <Plus className="mr-2 w-4 h-4" /> Create Service
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((service) => (
            <ProviderServiceCard
              key={service.id}
              service={service}
              onEditClick={openEditDialog}
              onArchiveClick={handleArchive}
              onDeleteClick={handleDelete}
            />
          ))}
        </div>
      )}

      <EditServiceModal
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        formValues={editForm}
        onFormChange={setEditForm}
        onSubmit={handleEditSubmit}
        isSubmitting={editing}
        onDeleteSuccess={() => {
          // Refresh the services list after deletion
          fetchServices();
        }}
      />
    </div>
  );
}
