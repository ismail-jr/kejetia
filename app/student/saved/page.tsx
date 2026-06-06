"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import ServiceGrid from "@/components/marketplace/ServiceGrid";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string };
  is_saved?: boolean;
};

export default function SavedPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_services")
        .select("service_id, services(*, profiles(full_name, avatar_url))")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Service[] = (data || [])
        .map((d: any) =>
          d.services ? { ...d.services, is_saved: true } : null,
        )
        .filter(Boolean);

      setServices(mapped);
    } catch (err) {
      console.error("Error pulling bookmarked lists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [user]);

  const handleSaveToggle = async (serviceId: string, saved: boolean) => {
    if (!user) {
      toast.error("Please log in to save services");
      return;
    }

    if (!saved) {
      const originalServices = [...services];
      setServices((prev) => prev.filter((s) => s.id !== serviceId));

      toast.promise(
        async () => {
          const { error } = await supabase
            .from("saved_services")
            .delete()
            .eq("student_id", user.id)
            .eq("service_id", serviceId);

          if (error) throw error;
        },
        {
          loading: "Removing from saved list...",
          success: "Removed from bookmarks!",
          error: () => {
            setServices(originalServices);
            return "Failed to remove from saved";
          },
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Services</h1>
          <p className="text-muted-foreground text-sm">
            Services you&apos;ve bookmarked
          </p>
        </div>
      </div>

      <ServiceGrid
        services={services}
        loading={loading}
        onSaveToggle={handleSaveToggle}
        emptyMessage="You haven't saved any services yet. Browse and heart services to save them here."
      />

      {!loading && services.length === 0 && (
        <div className="text-center mt-4">
          <Button asChild>
            <Link href="/student/browse">Browse Services</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
