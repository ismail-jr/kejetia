import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import {
  getAccessRedirect,
  parseProfileAccess,
  type SessionAccess,
} from "@/lib/auth/access";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let access: SessionAccess | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, roles, active_role, is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      access = parseProfileAccess(profile);
    }
  }

  const redirectTo = getAccessRedirect(request.nextUrl.pathname, access);
  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.search = redirectTo.startsWith("/login") ? url.search : "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
