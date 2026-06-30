// Typed data-access layer for Kejetia. All Supabase reads/writes for the
// core domain entities should go through these modules rather than
// calling the client inline in components — this keeps query shapes, the
// table-per-role joins, and the new schema column names in one place.

export * from "@/lib/data/types";
export * from "@/lib/data/profiles";
export * from "@/lib/data/services";
export * from "@/lib/data/saved-services";
export * from "@/lib/data/bookings";
export * from "@/lib/data/reviews";
export * from "@/lib/data/notifications";
export * from "@/lib/data/admin-analytics";
export * from "@/lib/data/platform-stats";
