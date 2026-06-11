"use client";

import { Clock, DollarSign, TrendingUp } from "lucide-react";

type PricingType = "fixed" | "hourly" | "negotiable";

interface PricingInfoBoxProps {
  pricingType: PricingType;
}

export function PricingInfoBox({ pricingType }: PricingInfoBoxProps) {
  const getIcon = () => {
    switch (pricingType) {
      case "hourly":
        return Clock;
      case "negotiable":
        return TrendingUp;
      default:
        return DollarSign;
    }
  };

  const getDescription = () => {
    switch (pricingType) {
      case "hourly":
        return "You will be charged based on the number of hours this service takes. Discuss timeline with provider before booking.";
      case "negotiable":
        return "The price shown is a starting point. Contact the provider to agree on a final price before booking.";
      default:
        return "This is a fixed price service. No additional costs beyond the quoted amount.";
    }
  };

  const Icon = getIcon();

  return (
    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground text-sm">
          Pricing Information
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{getDescription()}</p>
    </div>
  );
}
