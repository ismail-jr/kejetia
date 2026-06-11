"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaGalleryProps {
  images: string[] | null | any;
  title: string;
}

export function MediaGallery({ images, title }: MediaGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const hasImages = Array.isArray(images) && images.length > 0;
  const currentDisplayImage = hasImages ? images[activeImageIndex] : null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full rounded-2xl border border-border bg-muted overflow-hidden shadow-inner">
        {currentDisplayImage ? (
          <img
            src={currentDisplayImage}
            alt={`${title} view ${activeImageIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-300"
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

      {hasImages && images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((imgUrl: string, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border bg-muted group transition-all",
                activeImageIndex === idx
                  ? "border-primary ring-2 ring-primary/20 scale-95"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail view ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
