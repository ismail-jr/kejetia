"use client";

import { Clock, DollarSign, TrendingUp } from "lucide-react";

type PricingType = "fixed" | "hourly" | "negotiable";

interface PriceDisplayProps {
  price: number;
  pricingType: PricingType;
  size?: "small" | "large";
}

export function PriceDisplay({
  price,
  pricingType,
  size = "large",
}: PriceDisplayProps) {
  const getPriceDisplay = () => {
    const formattedPrice = price.toFixed(2);

    switch (pricingType) {
      case "hourly":
        return {
          label: `GH₵${formattedPrice}/hour`,
          subtext: "per hour",
          icon: Clock,
          description: "You will be charged for each hour of service",
        };
      case "negotiable":
        return {
          label: `From GH₵${formattedPrice}`,
          subtext: "negotiable",
          icon: TrendingUp,
          description: "Final price can be discussed with the provider",
        };
      case "fixed":
      default:
        return {
          label: `GH₵${formattedPrice}`,
          subtext: "fixed price",
          icon: DollarSign,
          description: "One-time fixed payment",
        };
    }
  };

  const priceDisplay = getPriceDisplay();
  const PriceIcon = priceDisplay.icon;

  const sizeClasses =
    size === "large"
      ? { label: "text-2xl font-black", icon: "w-4 h-4", subtext: "text-xs" }
      : { label: "text-lg font-bold", icon: "w-3 h-3", subtext: "text-[10px]" };

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className={`${sizeClasses.label} text-primary`}>
          {priceDisplay.label}
        </span>
        <span className={`${sizeClasses.subtext} text-muted-foreground`}>
          {priceDisplay.subtext}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {priceDisplay.description}
      </p>
    </div>
  );
}
