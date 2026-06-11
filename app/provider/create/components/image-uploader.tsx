"use client";

import { useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ImageIcon, Upload, Trash2 } from "lucide-react";
import { MAX_IMAGES, MAX_FILE_SIZE, ALLOWED_TYPES } from "./constants";

interface ImageUploaderProps {
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  imagePreviews: string[];
  setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>;
  uploading: boolean;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ImageUploader({
  images,
  setImages,
  imagePreviews,
  setImagePreviews,
  uploading,
  setUploading,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > MAX_IMAGES) {
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

    setUploading(true);
    try {
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);
      setImages([...images, ...validFiles]);
      toast.success(`${validFiles.length} image(s) added`);
    } catch (error) {
      toast.error("Failed to process images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    setImages(images.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  return (
    <Card className="rounded-2xl p-6 space-y-4">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-primary" />
        Service Images
      </h2>
      <p className="text-sm text-muted-foreground">
        Upload up to {MAX_IMAGES} images. The first image will be used as the
        cover photo.
      </p>

      <div
        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
          disabled={uploading || images.length >= MAX_IMAGES}
        />
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Click or drag images here to upload
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, WEBP up to 5MB
        </p>
        <p className="text-xs text-primary mt-2 font-medium">
          {images.length}/{MAX_IMAGES} images uploaded
        </p>
      </div>

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
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
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
