import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Edit,
  Archive,
  Trash2,
  Star,
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
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"];

interface ProviderServiceCardProps {
  service: Service;
  onEditClick: (service: Service) => void;
  onArchiveClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
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

  // Helper function to format price display based on pricing type
  const formatPriceDisplay = () => {
    const price = service.price;
    const pricingType = service.pricing_type || "fixed"; // Default to fixed if not set

    switch (pricingType) {
      case "hourly":
        return {
          label: `GH₵${price}/hour`,
          icon: Clock,
          suffix: "",
        };
      case "negotiable":
        return {
          label: `From GH₵${price}`,
          icon: TrendingUp,
          suffix: " negotiable",
        };
      case "fixed":
      default:
        return {
          label: `GH₵${price}`,
          icon: DollarSign,
          suffix: " fixed",
        };
    }
  };

  const priceDisplay = formatPriceDisplay();
  const PriceIcon = priceDisplay.icon;

  return (
    <Card className="rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
      <div>
        {/* Image Display frame */}
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

        {/* Info Wrapper Body */}
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>
                {service.avg_rating && service.avg_rating > 0
                  ? service.avg_rating.toFixed(1)
                  : "New"}
              </span>
              <span>· {service.total_bookings || 0} bookings</span>
            </div>
          </div>

          {/* Pricing type badge */}
          <div className="flex items-center gap-1.5 mt-1">
            <PriceIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground capitalize">
              {service.pricing_type || "fixed"} rate
            </span>
          </div>

          {service.rejection_reason && service.status === "rejected" && (
            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                <span className="font-medium">Rejection reason: </span>
                {service.rejection_reason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Item Mutation Controls */}
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
