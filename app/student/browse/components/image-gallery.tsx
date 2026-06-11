"use client";

import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  category: string;
  pricingType: string;
  PriceIcon: React.ElementType;
}

export function ImageGallery({
  images,
  category,
  pricingType,
  PriceIcon,
}: ImageGalleryProps) {
  const [activeImage, setActiveImage] = useState<string>(
    images[0] || "/images/placeholder-service.jpg",
  );

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-muted bg-muted shadow-sm">
        <img
          src="/images/placeholder-service.jpg"
          alt="No image available"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase text-primary tracking-wider">
            {category}
          </span>
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
            <PriceIcon className="w-3 h-3" />
            <span className="capitalize">{pricingType}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Image */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-muted bg-muted shadow-sm">
        <img
          src={activeImage}
          alt="Service image"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase text-primary tracking-wider">
            {category}
          </span>
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
            <PriceIcon className="w-3 h-3" />
            <span className="capitalize">{pricingType}</span>
          </span>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((imgUrl, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(imgUrl)}
              className={`relative w-20 aspect-video rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                activeImage === imgUrl
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
