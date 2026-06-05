"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Heart, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: {
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
  };
  is_saved?: boolean;
};

interface ServiceCardProps {
  service: Service;
  onSaveToggle?: (serviceId: string, saved: boolean) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  tutoring: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  design: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  programming:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  photography:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  writing:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  music: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  fitness:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  cooking: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

const PEXELS_IMAGES: Record<string, string> = {
  tutoring:
    "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=400",
  design:
    "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400",
  programming:
    "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400",
  photography:
    "https://images.pexels.com/photos/1787220/pexels-photo-1787220.jpeg?auto=compress&cs=tinysrgb&w=400",
  writing:
    "https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=400",
  music:
    "https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg?auto=compress&cs=tinysrgb&w=400",
  fitness:
    "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400",
  cooking:
    "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400",
  other:
    "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=400",
};

export default function ServiceCard({
  service,
  onSaveToggle,
}: ServiceCardProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(service.is_saved || false);
  const [savingToggle, setSavingToggle] = useState(false);

  const imageUrl =
    service.images?.[0] ||
    PEXELS_IMAGES[service.category] ||
    PEXELS_IMAGES.other;
  const providerInitials =
    service.profiles?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save services");
      return;
    }
    setSavingToggle(true);
    try {
      if (saved) {
        await supabase
          .from("saved_services")
          .delete()
          .eq("student_id", user.id)
          .eq("service_id", service.id);
        setSaved(false);
        onSaveToggle?.(service.id, false);
        toast.success("Removed from saved");
      } else {
        await supabase
          .from("saved_services")
          .insert({ student_id: user.id, service_id: service.id });
        setSaved(true);
        onSaveToggle?.(service.id, true);
        toast.success("Service saved!");
      }
    } catch {
      toast.error("Failed to update saved services");
    } finally {
      setSavingToggle(false);
    }
  };

  return (
    <Link href={`/student/services/${service.id}`}>
      <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 cursor-pointer">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                CATEGORY_COLORS[service.category] ||
                  "bg-muted text-muted-foreground",
              )}
            >
              {service.category}
            </span>
          </div>
          <button
            onClick={handleSaveToggle}
            disabled={savingToggle}
            className={cn(
              "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150",
              saved
                ? "bg-red-500 text-white"
                : "bg-black/20 backdrop-blur-sm text-white hover:bg-black/40",
            )}
          >
            <Heart className={cn("w-4 h-4", saved ? "fill-current" : "")} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {service.title}
          </h3>

          {/* Provider */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-5 h-5">
              <AvatarImage src={service.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary text-white text-xs">
                {providerInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {service.profiles?.full_name || "Anonymous"}
            </span>
            {service.profiles?.is_verified && (
              <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-foreground">
                {service.avg_rating > 0 ? service.avg_rating.toFixed(1) : "New"}
              </span>
              {service.total_reviews > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({service.total_reviews})
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground">
                GH₵ {Number(service.price).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
