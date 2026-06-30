import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Single browser client instance. Exported untyped as `supabase` for the
// existing call sites that pre-date the typed data layer, and as a typed
// view (`db`) over the SAME instance for the lib/data access layer. Both
// share one GoTrue auth/session — do not call createClient again.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = supabase as unknown as SupabaseClient<Database>;
