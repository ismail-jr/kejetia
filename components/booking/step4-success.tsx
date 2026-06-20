"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  PhoneCall,
} from "lucide-react";

interface Step4SuccessProps {
  providerProfile: any;
  onClose: () => void;
}

export function Step4Success({ providerProfile, onClose }: Step4SuccessProps) {
  return (
    <div className="py-6 text-center space-y-4 max-w-md mx-auto">
      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h4 className="text-xl font-bold text-foreground">
          Booking Order Sent!
        </h4>
        <p className="text-sm text-muted-foreground">
          Your entry is logged as{" "}
          <span className="font-semibold text-amber-600">Pending Approval</span>
          .
        </p>
      </div>

      <div className="bg-muted/20 border border-border/60 rounded-xl p-4 text-left space-y-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <ArrowRight className="h-4 w-4" />
          <span>Next Steps</span>
        </div>

        <div className="flex items-start gap-2 text-amber-600">
          <PhoneCall className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="font-medium leading-relaxed">
            Call or message the provider immediately to coordinate plans during
            their active hours.
            <span className="inline-flex items-center gap-1 ml-1">
              <Clock3 className="h-3 w-3" />
              {providerProfile?.available_time || "08:00 AM - 05:00 PM"}
            </span>
          </p>
        </div>

        <div className="flex items-start gap-2 text-muted-foreground">
          <ClipboardCheck className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            Double-check their layout rules or drop-off location instructions.
          </p>
        </div>
      </div>

      {providerProfile && (
        <div className="flex items-center justify-between p-3.5 bg-background border border-border/80 rounded-xl">
          <div className="text-left">
            <span className="text-[11px] text-muted-foreground uppercase block tracking-wider font-semibold">
              Contact Provider ({providerProfile.full_name})
            </span>
            <span className="text-sm font-bold text-foreground font-mono">
              {providerProfile.phone}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`tel:${providerProfile.phone}`)}
            className="gap-2 rounded-xl text-xs font-medium"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call Provider
          </Button>
        </div>
      )}

      <Button onClick={onClose} className="w-full mt-2 rounded-xl font-medium">
        Close
      </Button>
    </div>
  );
}
