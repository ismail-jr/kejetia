"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, MapPin } from "lucide-react";
import { MessageUserButton } from "@/components/messaging/message-user-button";

interface ProviderProfileProps {
  providerId: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  location?: string | null;
}

export function ProviderProfile({
  providerId,
  fullName,
  avatarUrl,
  phone,
  location,
}: ProviderProfileProps) {
  const providerAvatar =
    avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName || "UCC"}`;

  return (
    <div className="p-4 bg-muted/50 rounded-xl border border-muted/50 space-y-3.5">
      <div className="flex items-center gap-3">
        <img
          src={providerAvatar}
          alt={fullName}
          className="w-11 h-11 rounded-full object-cover border bg-background"
        />
        <div className="min-w-0 flex-1">
          <span className="text-xs text-muted-foreground block font-medium">
            Offered by UCC Peer
          </span>
          <Link
            href={`/providers/${providerId}`}
            className="font-bold text-base text-foreground block truncate hover:text-primary transition-colors"
          >
            {fullName || "UCC Student"}
          </Link>
        </div>
      </div>

      {location && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-2 rounded-lg border border-muted/40">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-0.5">
        {phone ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 text-xs gap-1.5 h-9 rounded-lg border-muted bg-background hover:bg-muted transition"
          >
            <a href={`tel:${phone}`}>
              <Phone className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
              {phone}
            </a>
          </Button>
        ) : (
          <div className="flex-1 text-center py-2 text-[11px] text-muted-foreground bg-background rounded-lg border border-dashed">
            No phone number provided
          </div>
        )}

        <MessageUserButton
          targetUserId={providerId}
          variant="outline"
          size="sm"
          label=""
          showIcon
          className="px-3 h-9 rounded-lg border-muted bg-background hover:bg-muted"
        />
      </div>
    </div>
  );
}
