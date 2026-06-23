// components/profile/public-preview-view.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  CalendarDays,
  Clock,
  ShieldCheck,
  Building,
} from "lucide-react";

export interface PublicProviderData {
  full_name: string | null;
  bio?: string | null;
  location: string | null;
  phone: string | null;
  avatar_url?: string | null;
  available_days?: string[] | null;
  available_time?: string | null;
  roles?: string[] | null;
}

interface PublicPreviewViewProps {
  provider: PublicProviderData;
}

export function PublicPreviewView({ provider }: PublicPreviewViewProps) {
  const isProvider = provider.roles?.includes("provider");

  const initials =
    provider.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PV";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header Profile Card */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar className="w-24 h-24 border-2 border-primary/20 rounded-2xl">
          <AvatarImage
            src={provider.avatar_url || ""}
            alt={provider.full_name || "Provider"}
            className="object-cover"
          />
          <AvatarFallback className="bg-muted text-muted-foreground text-xl font-bold rounded-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3 text-center sm:text-left w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                {provider.full_name}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-muted-foreground text-sm mt-1">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{provider.location}</span>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end gap-2">
              {isProvider && (
                <Badge
                  variant="secondary"
                  className="rounded-lg gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary border-none"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Provider
                </Badge>
              )}
            </div>
          </div>

          {provider.bio ? (
            <p className="text-sm text-muted-foreground leading-relaxed pt-1">
              {provider.bio}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground/60 pt-1">
              No business terms or bio description provided yet.
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Availability Sidebar Card */}
        <div className="md:col-span-1 bg-card rounded-2xl border border-border/50 p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="w-4 h-4 text-primary" /> Availability
            Window
          </h3>

          <div className="space-y-3 pt-1">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Operating Days
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {Array.isArray(provider.available_days) &&
                provider.available_days.length > 0 ? (
                  provider.available_days.map((day) => (
                    <Badge
                      key={day}
                      variant="outline"
                      className="rounded-md bg-muted/40 text-xs font-normal"
                    >
                      {day}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Days not configured
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground block font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Daily Hours
              </span>
              <p className="text-sm font-semibold text-foreground mt-1">
                {provider.available_time || "Not specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Booking & Contact Information Card */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border/50 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            <Building className="w-4 h-4 text-primary" /> Contact Details
          </h3>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Official Contact Hotline
                </p>
                <p className="text-base font-bold text-foreground tracking-wide">
                  {provider.phone}
                </p>
              </div>
            </div>

            <a
              href={`tel:${provider.phone}`}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Call Now
            </a>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Mobile Money Payout metrics are hidden automatically to maintain
            provider privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
