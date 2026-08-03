import { db } from "@/lib/supabase";

export interface PlatformStats {
  activeUsers: number;
  servicesListed: number;
  averageRating: number;
  successRate: number;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await db.rpc("get_platform_stats").single();

  if (error) throw error;

  return {
    activeUsers: data?.active_users ?? 0,
    servicesListed: data?.services_listed ?? 0,
    averageRating: data?.average_rating ?? 0,
    successRate: data?.success_rate ?? 0,
  };
}
