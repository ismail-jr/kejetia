"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Archive,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];

const CATEGORIES = [
  { value: "tutoring", label: "Tutoring" },
  { value: "design", label: "Design" },
  { value: "programming", label: "Programming" },
  { value: "photography", label: "Photography" },
  { value: "writing", label: "Writing" },
  { value: "music", label: "Music" },
  { value: "fitness", label: "Fitness" },
  { value: "cooking", label: "Cooking" },
  { value: "other", label: "Other" },
];

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    style: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending Review",
    style:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    style:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    style: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
  archived: {
    label: "Archived",
    style: "bg-muted text-muted-foreground",
    icon: Archive,
  },
};

const PEXELS_FALLBACK =
  "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=400";

export default function ProviderServicesPage() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "approved" | "pending" | "rejected" | "archived"
  >("all");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
  });

  const fetchServices = useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setServices(data);
    } catch (error) {
      toast.error("Could not fetch your services data");
    } finally {
      setLoading(false);
    }
  }, [profile]);

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
      title: service.title,
      description: service.description || "",
      category: service.category,
      price: service.price,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingService) return;
    setEditing(true);

    try {
      const { data, error } = await supabase
        .from("services")
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          price: editForm.price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingService.id)
        .select()
        .single();

      if (error) throw error;

      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? data : s)),
      );

      toast.success("Service updated successfully");
      setEditDialogOpen(false);
      setEditingService(null);
    } catch (error) {
      toast.error("Failed to update service listing");
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
      {/* Header */}
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
          <Link href="/provider/services/create">
            <Plus className="mr-2 w-4 h-4" />
            New Service
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl p-4 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {services.filter((s) => s.status === "approved").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {services.filter((s) => s.status === "pending").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl p-4 bg-gradient-to-br from-red-500/10 to-red-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {services.filter((s) => s.status === "rejected").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
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

      {/* Loading State */}
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
              : `No ${filter} services available right now.`}
          </p>
          {filter === "all" && (
            <Button asChild>
              <Link href="/provider/services/create">
                <Plus className="mr-2 w-4 h-4" />
                Create Service
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((service) => {
            const statusConfig =
              STATUS_CONFIG[service.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const imageUrl = service.images?.[0] || PEXELS_FALLBACK;

            return (
              <Card
                key={service.id}
                className="rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Image */}
                  <div className="relative h-48 bg-muted w-full">
                    <Image
                      src={imageUrl}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm",
                          statusConfig.style,
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-lg font-bold text-primary">
                          GH₵{service.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          / service
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>
                          {service.avg_rating > 0
                            ? service.avg_rating.toFixed(1)
                            : "New"}
                        </span>
                        <span>· {service.total_bookings} bookings</span>
                      </div>
                    </div>

                    {service.rejection_reason &&
                      service.status === "rejected" && (
                        <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                            <span className="font-medium">
                              Rejection reason:
                            </span>{" "}
                            {service.rejection_reason}
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Actions Button Row */}
                <div className="p-4 pt-0 flex gap-2">
                  {service.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl flex-1"
                      asChild
                    >
                      <Link href={`/student/services/${service.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl flex-1"
                    onClick={() => openEditDialog(service)}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  {service.status !== "archived" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl px-2.5"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Archive this service?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This service will be hidden from students across the
                            application feed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleArchive(service.id)}
                          >
                            Archive
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl px-2.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this service permanent?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. All active marketplace
                          data regarding this item will be removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(service.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Make changes to your service listing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Service Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="Enter service title"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, category: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (GH₵)</Label>
              <Input
                id="edit-price"
                type="number"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm({ ...editForm, price: Number(e.target.value) })
                }
                placeholder="Enter price"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Describe your service..."
                rows={5}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editing}
              className="rounded-xl"
            >
              {editing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
