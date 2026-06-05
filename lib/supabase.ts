import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use untyped client to avoid PostgrestVersion 12 strict typing issues
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
