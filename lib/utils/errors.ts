// Supabase's PostgrestError (and most Error subclasses) set `message` as
// a non-enumerable inherited property, so `console.error(err)` in error
// reporters that JSON.stringify their arguments — and some browser
// extensions — show a useless "{}" instead of the actual failure. Pull
// the fields that actually matter out into a plain, loggable object.
export function describeSupabaseError(err: unknown): {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
} {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    return {
      message:
        (typeof e.message === "string" && e.message) ||
        (typeof e.error === "string" && e.error) ||
        "Unknown error",
      code: typeof e.code === "string" ? e.code : undefined,
      details: typeof e.details === "string" ? e.details : undefined,
      hint: typeof e.hint === "string" ? e.hint : undefined,
    };
  }
  return { message: typeof err === "string" ? err : "Unknown error" };
}
