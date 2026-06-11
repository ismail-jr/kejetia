"use client";

import { ShieldCheck, Calendar } from "lucide-react";

interface ServiceMetadataProps {
  status: string;
  createdAt: string;
}

export function ServiceMetadata({ status, createdAt }: ServiceMetadataProps) {
  return (
    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
      <div className="p-3 border border-muted rounded-xl flex flex-col gap-1">
        <span className="font-semibold text-foreground flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Status
        </span>
        <span className="capitalize">{status}</span>
      </div>
      <div className="p-3 border border-muted rounded-xl flex flex-col gap-1">
        <span className="font-semibold text-foreground flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-primary" /> Posted
        </span>
        <span>{new Date(createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
