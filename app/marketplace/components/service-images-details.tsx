"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface ServiceImagesProps {
  title: string;
  category: string;
  images: string[];
}

export function ServiceImages({ title, category, images }: ServiceImagesProps) {
  const [activeImage, setActiveImage] = useState(0);
  const imageUrls = images || [];
  const displayImage =
    imageUrls[activeImage] || "/images/placeholder-service.jpg";

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={displayImage}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 500px"
          className="object-cover"
          priority
        />
        <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0">
          {category}
        </Badge>
      </div>

      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                activeImage === index
                  ? "border-primary"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt={`Thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
