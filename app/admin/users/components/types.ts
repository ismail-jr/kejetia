export type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  student_id: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  roles: string[] | null;
  active_role: string | null;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export const ROLE_STYLES: Record<string, string> = {
  student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  provider:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export const TABS = ["all", "student", "provider", "admin"] as const;
export type FilterTab = (typeof TABS)[number];
