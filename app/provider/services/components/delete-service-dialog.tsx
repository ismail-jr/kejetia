"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DeleteServiceDialogProps {
  serviceId: string;
  serviceTitle: string;
  onDeleteSuccess: () => void;
  trigger?: React.ReactNode;
}

export function DeleteServiceDialog({
  serviceId,
  serviceTitle,
  onDeleteSuccess,
  trigger,
}: DeleteServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // First, delete images from storage
      const { data: service } = await supabase
        .from("services")
        .select("images")
        .eq("id", serviceId)
        .single();

      if (service?.images && service.images.length > 0) {
        // Extract file paths from URLs
        const filePaths = service.images
          .map((url: string) => {
            const urlParts = url.split("/services/");
            return urlParts[1];
          })
          .filter(Boolean);

        if (filePaths.length > 0) {
          await supabase.storage
            .from("services")
            .remove(filePaths.map((path: string) => `services/${path}`));
        }
      }

      // Delete the service record
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      toast.success(`"${serviceTitle}" has been deleted permanently`);
      onDeleteSuccess();
      setOpen(false);
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast.error(error.message || "Failed to delete service");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
          className="rounded-xl"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Service
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{serviceTitle}"? This action
              cannot be undone. All associated images and data will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
