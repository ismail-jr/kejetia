import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Edit,
  Archive,
  Trash2,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, PEXELS_FALLBACK } from "./constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ServiceWithReviews } from "./types";

interface ProviderServiceCardProps {
  service: ServiceWithReviews;
  onEditClick: (service: ServiceWithReviews) => void;
  onArchiveClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" />
    </svg>
  );
}

export function ProviderServiceCard({
  service,
  onEditClick,
  onArchiveClick,
  onDeleteClick,
}: ProviderServiceCardProps) {
  const statusConfig = STATUS_CONFIG[service.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const imageUrl = service.images?.[0] || PEXELS_FALLBACK;

  const formatPriceDisplay = () => {
    const price = service.price;
    const pricingType = service.pricing_type || "fixed";

    switch (pricingType) {
      case "hourly":
        return { label: `GH₵${price}/hour`, icon: Clock, suffix: "" };
      case "negotiable":
        return {
          label: `From GH₵${price}`,
          icon: TrendingUp,
          suffix: " negotiable",
        };
      case "fixed":
      default:
        return { label: `GH₵${price}`, icon: DollarSign, suffix: " fixed" };
    }
  };

  const priceDisplay = formatPriceDisplay();
  const PriceIcon = priceDisplay.icon;

  const hasRating = service.avg_rating && service.avg_rating > 0;
  const ratingDisplay = hasRating ? service.avg_rating?.toFixed(1) : "New";
  const reviewCount = service.total_reviews || 0;
  const bookingsCount = service.total_bookings || 0;

  return (
    <Card className="rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div className="relative h-48 bg-muted w-full">
          <Image
            src={imageUrl}
            alt={service.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm",
                statusConfig.style,
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-1">
            {service.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary">
                {priceDisplay.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {priceDisplay.suffix}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-0.5">
                <StarIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">{ratingDisplay}</span>
                {reviewCount > 0 && (
                  <span className="text-muted-foreground/70 ml-0.5">
                    ({reviewCount})
                  </span>
                )}
              </div>
              <span>·</span>
              <span>
                {bookingsCount} booking{bookingsCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <PriceIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground capitalize">
              {service.pricing_type || "fixed"} rate
            </span>
          </div>

          {service.rejection_reason && service.status === "rejected" && (
            <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive line-clamp-2">
                <span className="font-medium">Rejection reason: </span>
                {service.rejection_reason}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-0 border-t border-border/50 mt-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl h-9 text-xs"
          onClick={() => onEditClick(service)}
          disabled={service.status === "archived"}
        >
          <Edit className="w-3.5 h-3.5 mr-1.5" />
          Edit
        </Button>

        {service.status !== "archived" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 rounded-xl h-9 text-xs text-muted-foreground hover:text-warning"
              >
                <Archive className="w-3.5 h-3.5 mr-1.5" />
                Archive
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Archive service listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will hide the service from students. You can still see it
                  in your archived list.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onArchiveClick(service.id)}
                  className="rounded-xl"
                >
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 rounded-xl h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete listing permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently wipe out
                  the record from database logs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteClick(service.id)}
                  className="bg-destructive hover:bg-destructive/90 rounded-xl"
                >
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Card>
  );
}
