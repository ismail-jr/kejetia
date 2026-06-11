"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ImageManager } from "./edit-image-manager";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { TagManager } from "./edit-tag-manager";

const MAX_IMAGES = 5;

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

interface EditServiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formValues: EditFormState;
  onFormChange: (values: EditFormState) => void;
  onSubmit: (updatedImages?: string[]) => Promise<void>;
  isSubmitting: boolean;
  onDeleteSuccess?: () => void;
}

export function EditServiceModal({
  isOpen,
  onOpenChange,
  formValues,
  onFormChange,
  onSubmit,
  isSubmitting,
  onDeleteSuccess,
}: EditServiceModalProps) {
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Reset state when modal opens with new service data
  useEffect(() => {
    if (isOpen) {
      setNewImageFiles([]);
      setNewImagePreviews([]);
    }

    return () => {
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [isOpen]);

  // Upload new images to storage
  const uploadNewImages = async (serviceId: string): Promise<string[]> => {
    if (newImageFiles.length === 0) return [];

    const uploadedUrls: string[] = [];
    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${serviceId}/${Date.now()}-${i}.${fileExt}`;
      const filePath = `services/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("services")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("services")
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }
    return uploadedUrls;
  };

  const handleAddImages = (files: File[]) => {
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);
    setNewImageFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveExisting = (index: number) => {
    const updatedImages = formValues.images.filter((_, i) => i !== index);
    onFormChange({ ...formValues, images: updatedImages });
    toast.success("Image removed");
  };

  const handleRemoveNew = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleAddTag = (tag: string) => {
    onFormChange({ ...formValues, tags: [...formValues.tags, tag] });
  };

  const handleRemoveTag = (tag: string) => {
    onFormChange({
      ...formValues,
      tags: formValues.tags.filter((t) => t !== tag),
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (formValues.images.length === 0 && newImageFiles.length === 0) {
      toast.error("Please upload at least one image for your service");
      return;
    }

    setUploadingImages(true);
    try {
      let allImages = [...formValues.images];

      if (newImageFiles.length > 0 && formValues.id) {
        const newUrls = await uploadNewImages(formValues.id);
        allImages = [...allImages, ...newUrls];
      }

      await onSubmit(allImages);

      // Clear new images on success
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setNewImageFiles([]);
      setNewImagePreviews([]);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteSuccess = () => {
    onOpenChange(false);
    if (onDeleteSuccess) {
      onDeleteSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Listing</DialogTitle>
          <DialogDescription>
            Modify details for your listing. Note: updates may re-trigger a
            status validation checklist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <ImageManager
            existingImages={formValues.images}
            newImagePreviews={newImagePreviews}
            newImageFiles={newImageFiles}
            onAddImages={handleAddImages}
            onRemoveExisting={handleRemoveExisting}
            onRemoveNew={handleRemoveNew}
            disabled={isSubmitting || uploadingImages}
          />

          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-medium">
              Service Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={formValues.title}
              onChange={(e) =>
                onFormChange({ ...formValues, title: e.target.value })
              }
              className="rounded-xl h-11"
              placeholder="e.g., Expert Mathematics Tutoring for Level 100-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category" className="text-sm font-medium">
              Category / Industry Focus{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-category"
              value={formValues.category}
              onChange={(e) =>
                onFormChange({ ...formValues, category: e.target.value })
              }
              className="rounded-xl h-11"
              placeholder="e.g., Graphic Design, Academic Tutoring, Laundry"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit-pricing-type"
                className="text-sm font-medium"
              >
                Pricing Rate Model <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formValues.pricing_type}
                onValueChange={(v) =>
                  onFormChange({ ...formValues, pricing_type: v as any })
                }
              >
                <SelectTrigger
                  id="edit-pricing-type"
                  className="rounded-xl h-11"
                >
                  <SelectValue placeholder="Select price model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="negotiable">
                    Starting From / Negotiable
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price" className="text-sm font-medium">
                Price (GH₵) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-price"
                type="number"
                value={formValues.price}
                onChange={(e) =>
                  onFormChange({ ...formValues, price: Number(e.target.value) })
                }
                className="rounded-xl h-11"
                min={1}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-description"
              value={formValues.description}
              onChange={(e) =>
                onFormChange({ ...formValues, description: e.target.value })
              }
              className="rounded-xl min-h-[120px] resize-none"
              placeholder="Describe what you offer, your experience, what's included..."
            />
          </div>

          <TagManager
            tags={formValues.tags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            disabled={isSubmitting || uploadingImages}
            maxTags={8}
          />
        </div>

        <DialogFooter className="gap-2">
          {formValues.id && (
            <DeleteServiceDialog
              serviceId={formValues.id}
              serviceTitle={formValues.title}
              onDeleteSuccess={handleDeleteSuccess}
              trigger={
                <Button
                  variant="destructive"
                  className="rounded-xl h-11"
                  disabled={isSubmitting || uploadingImages}
                >
                  Delete
                </Button>
              }
            />
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-11"
            disabled={isSubmitting || uploadingImages}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-xl h-11 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all"
            disabled={isSubmitting || uploadingImages}
          >
            {(isSubmitting || uploadingImages) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {uploadingImages ? "Uploading Images..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
