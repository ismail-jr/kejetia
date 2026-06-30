import { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type StudentProfile =
  Database["public"]["Tables"]["student_profiles"]["Row"];
export type ProviderProfile =
  Database["public"]["Tables"]["provider_profiles"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type SavedService =
  Database["public"]["Tables"]["saved_services"]["Row"];
export type Notification =
  Database["public"]["Tables"]["notifications"]["Row"];

export type UserRole = Database["public"]["Enums"]["user_role_enum"];
export type ServiceStatus =
  Database["public"]["Enums"]["service_status_enum"];
export type BookingStatus =
  Database["public"]["Enums"]["booking_status_enum"];

// A lightweight provider/identity summary used wherever a service or
// booking needs to show who the provider/client is.
export interface PartySummary {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  location?: string | null;
  phone?: string | null;
}

// Full public-facing provider profile: identity fields merged with the
// provider-only extension (momo + availability + aggregates).
export interface ProviderPublicProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  is_verified: boolean;
  roles: string[];
  headline: string | null;
  momo_name: string | null;
  momo_network: string | null;
  momo_number: string | null;
  available_days: string[];
  available_time: string | null;
  avg_rating: number;
  total_reviews: number;
  total_bookings: number;
}

// A service joined with its provider's identity summary.
export type ServiceWithProvider = Service & {
  provider: PartySummary | null;
};
