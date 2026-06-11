"use client";

import Image from "next/image";
import { Upload, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

interface ImageManagerProps {
  existingImages: string[];
  newImagePreviews: string[];
  newImageFiles: File[];
  onAddImages: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
  disabled?: boolean;
}

export function ImageManager({
  existingImages,
  newImagePreviews,
  newImageFiles,
  onAddImages,
  onRemoveExisting,
  onRemoveNew,
  disabled = false,
}: ImageManagerProps) {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const totalImages =
      existingImages.length + newImageFiles.length + files.length;
    if (totalImages > MAX_IMAGES) {
      toast.error(`You can only upload up to ${MAX_IMAGES} images`);
      return;
    }

    const validFiles = files.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    onAddImages(validFiles);
    toast.success(`${validFiles.length} image(s) added`);
  };

  return (
    <Card className="rounded-xl p-4 space-y-3 border-none shadow-none bg-muted/30">
      <h3 className="font-semibold text-sm">Service Images</h3>
      <p className="text-xs text-muted-foreground">
        First image will be used as cover. Max {MAX_IMAGES} images total.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Existing Images */}
        {existingImages.map((imageUrl, index) => (
          <div key={`existing-${index}`} className="relative group">
            <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <Image
                src={imageUrl}
                alt={`Service image ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-medium bg-primary text-white px-2 py-0.5 rounded-full">
                    Cover
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemoveExisting(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              disabled={disabled}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* New Image Previews */}
        {newImagePreviews.map((preview, index) => (
          <div key={`new-${index}`} className="relative group">
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50 bg-muted">
              <Image
                src={preview}
                alt={`New image ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-medium bg-primary text-white px-2 py-0.5 rounded-full">
                  New
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveNew(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              disabled={disabled}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Upload Button */}
        {existingImages.length + newImageFiles.length < MAX_IMAGES && (
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center bg-muted/20">
            <Upload className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Upload</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={disabled}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Supported: JPEG, PNG, WEBP up to 5MB
      </p>
    </Card>
  );
}
