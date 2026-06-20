// types.ts
import type { Database } from "@/lib/database.types";

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type FilterType =
  | "all"
  | "approved"
  | "pending"
  | "rejected"
  | "archived";
export type PricingType = "fixed" | "hourly" | "negotiable";

// Extend Service type with review data (since your services table already has avg_rating and total_reviews)
export interface ServiceWithReviews extends Service {
  // The database already has these fields, but we keep the interface for consistency
  avg_rating: number;
  total_reviews: number;
  total_bookings: number;
}

export interface EditFormState {
  id?: string;
  title: string;
  description: string;
  category: string;
  pricing_type: "fixed" | "hourly" | "negotiable";
  price: number;
  tags: string[];
  images: string[];
  status?: string;
}
