import type { Database } from "@/lib/database.types";

export type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: { full_name: string } | null;
};

export const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30",
  rejected:
    "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/30",
  archived: "bg-muted text-muted-foreground border border-border/40",
};
