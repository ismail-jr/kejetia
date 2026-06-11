"use client";

import { format } from "date-fns";
import { Calendar, User, Tag } from "lucide-react";
import { MediaGallery } from "./id-media-gallery";
import { Service } from "./types";

interface DetailContentProps {
  service: Service;
}

export function DetailContent({ service }: DetailContentProps) {
  return (
    <div className="md:col-span-2 space-y-6">
      {/* Header Metadata */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {service.title || "Untitled Service"}
        </h1>
        <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md">
            <User className="w-3.5 h-3.5" />
            {service.profiles?.full_name ?? "Unknown"}
          </span>
          <span className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md">
            <Tag className="w-3.5 h-3.5 capitalize" />{" "}
            {service.category || "Uncategorized"}
          </span>
          <span className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5" />
            {service.created_at
              ? format(new Date(service.created_at), "PPP")
              : "Unknown Date"}
          </span>
        </div>
      </div>

      {/* Media Carousel Gallery */}
      <MediaGallery
        images={service.images}
        title={service.title || "Service"}
      />

      {/* Service Description Card */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Service Description
        </h3>
        <div className="p-5 rounded-2xl bg-card border border-border text-sm text-foreground/90 whitespace-pre-line leading-relaxed shadow-sm">
          {service.description ||
            "No descriptive text has been added to this system listing details entry."}
        </div>
      </div>

      {/* Search Keywords Tags Output Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Search Verification Tags
        </h3>
        <div className="p-4 rounded-2xl bg-card border border-border flex flex-wrap gap-2 shadow-sm">
          {service.tags && service.tags.length > 0 ? (
            service.tags.map((tag) => (
              <span
                key={tag}
                className="bg-primary/5 border border-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider"
              >
                {tag}
              </span>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic pl-1">
              No custom key search identifiers linked to this listing module.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
