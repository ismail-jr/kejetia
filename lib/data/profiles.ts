import { db } from "@/lib/supabase";
import type {
  Profile,
  ProviderProfile,
  StudentProfile,
  ProviderPublicProfile,
} from "@/lib/data/types";

// ── Identity ────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type IdentityPatch = Partial<
  Pick<
    Profile,
    | "full_name"
    | "phone"
    | "location"
    | "bio"
    | "avatar_url"
    | "student_id"
    | "active_role"
  >
>;

export async function updateIdentity(
  userId: string,
  patch: IdentityPatch,
): Promise<void> {
  const { error } = await db
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw error;
}

// ── Role extensions ─────────────────────────────────────────────────

export async function getStudentProfile(
  userId: string,
): Promise<StudentProfile | null> {
  const { data, error } = await db
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProviderProfile(
  userId: string,
): Promise<ProviderProfile | null> {
  const { data, error } = await db
    .from("provider_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type ProviderProfilePatch = Partial<
  Pick<
    ProviderProfile,
    | "headline"
    | "momo_name"
    | "momo_network"
    | "momo_number"
    | "available_days"
    | "available_time"
  >
>;

// Updates the provider-only fields. Uses upsert so it also works the
// first time a provider edits their commerce details after the row was
// created with defaults at registration.
export async function upsertProviderProfile(
  userId: string,
  patch: ProviderProfilePatch,
): Promise<void> {
  const { error } = await db
    .from("provider_profiles")
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) throw error;
}

export type StudentProfilePatch = Partial<
  Pick<StudentProfile, "program" | "level">
>;

export async function upsertStudentProfile(
  userId: string,
  patch: StudentProfilePatch,
): Promise<void> {
  const { error } = await db
    .from("student_profiles")
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) throw error;
}

// ── Composed public profile ─────────────────────────────────────────

// Fetches a provider's full public profile by merging the identity row
// (profiles) with the provider extension (provider_profiles). Returns
// null if the user has no identity row. Provider-only fields fall back to
// sensible defaults when the user is not (yet) a provider.
export async function getProviderPublicProfile(
  userId: string,
): Promise<ProviderPublicProfile | null> {
  const [profile, provider] = await Promise.all([
    getProfile(userId),
    getProviderProfile(userId),
  ]);

  if (!profile) return null;

  return {
    user_id: profile.user_id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    location: profile.location,
    phone: profile.phone,
    is_verified: profile.is_verified,
    roles: profile.roles ?? [],
    headline: provider?.headline ?? null,
    momo_name: provider?.momo_name ?? null,
    momo_network: provider?.momo_network ?? null,
    momo_number: provider?.momo_number ?? null,
    available_days: provider?.available_days ?? [],
    available_time: provider?.available_time ?? null,
    avg_rating: provider?.avg_rating ?? 0,
    total_reviews: provider?.total_reviews ?? 0,
    total_bookings: provider?.total_bookings ?? 0,
  };
}

// Batch fetch identity summaries for a set of user ids (providers or
// clients), keyed by user_id. Used to stitch names/avatars onto lists.
export async function getPartySummaries(
  userIds: string[],
): Promise<Map<string, { user_id: string; full_name: string; avatar_url: string | null; location: string | null; phone: string | null }>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const { data, error } = await db
    .from("profiles")
    .select("user_id, full_name, avatar_url, location, phone")
    .in("user_id", unique);

  if (error) throw error;

  return new Map((data ?? []).map((p) => [p.user_id, p]));
}
