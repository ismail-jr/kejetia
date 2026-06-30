import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie-backed browser client so Next.js middleware (@supabase/ssr) can read
// the same session. The old createClient() stored auth in localStorage only,
// which made /admin/* middleware think the user was logged out.
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
);

export const db = supabase as unknown as SupabaseClient<Database>;
