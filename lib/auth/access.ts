export type AppRole = "student" | "provider" | "admin";

export type SessionAccess = {
  userId: string;
  roles: AppRole[];
  activeRole: AppRole;
  isAdmin: boolean;
};

const APP_ROLES: AppRole[] = ["student", "provider", "admin"];

export function parseProfileAccess(profile: {
  user_id: string;
  roles: string[] | null;
  active_role: string | null;
  is_admin: boolean;
}): SessionAccess {
  const roles = (profile.roles ?? []).filter((role): role is AppRole =>
    APP_ROLES.includes(role as AppRole),
  );

  const isAdmin = profile.is_admin === true || roles.includes("admin");
  const normalizedRoles =
    isAdmin && !roles.includes("admin") ? [...roles, "admin" as AppRole] : roles;
  const activeRole = resolveActiveRole(
    profile.active_role,
    normalizedRoles,
    isAdmin,
  );

  return {
    userId: profile.user_id,
    roles: normalizedRoles,
    activeRole,
    isAdmin,
  };
}

function resolveActiveRole(
  activeRole: string | null,
  roles: AppRole[],
  isAdmin: boolean,
): AppRole {
  if (activeRole && APP_ROLES.includes(activeRole as AppRole)) {
    return activeRole as AppRole;
  }
  if (isAdmin) return "admin";
  if (roles.length > 0) return roles[0];
  return "student";
}

/** Paths that never require authentication. */
const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/register",
  "/verify",
  "/how-it-works",
  "/contact",
  "/marketplace",
]);

const PUBLIC_PREFIXES = ["/marketplace/", "/providers/"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isAuthEntryPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify" ||
    pathname === "/role-selection"
  );
}

export function defaultDashboardPath(access: SessionAccess): string {
  if (access.isAdmin) return "/admin/dashboard";

  const workspaceRoles = access.roles.filter((role) => role !== "admin");
  if (workspaceRoles.length > 1) return "/role-selection";
  if (workspaceRoles.length === 1) return `/${workspaceRoles[0]}/dashboard`;
  if (access.roles.length > 0) return `/${access.roles[0]}/dashboard`;

  return "/login";
}

/**
 * Returns a redirect target when the current user may not access `pathname`,
 * or `null` when the request should proceed.
 */
export function getAccessRedirect(
  pathname: string,
  access: SessionAccess | null,
): string | null {
  if (isPublicPath(pathname)) {
    if (access && isAuthEntryPath(pathname) && pathname !== "/role-selection") {
      return defaultDashboardPath(access);
    }
    return null;
  }

  if (!access) {
    const next = encodeURIComponent(pathname);
    return `/login?next=${next}`;
  }

  if (pathname.startsWith("/admin")) {
    if (!access.isAdmin) {
      return defaultDashboardPath(access);
    }
    return null;
  }

  if (pathname.startsWith("/student")) {
    if (!access.roles.includes("student")) {
      return access.isAdmin
        ? "/admin/dashboard"
        : access.roles.includes("provider")
          ? "/provider/dashboard"
          : "/role-selection";
    }
    if (access.activeRole === "admin" && access.isAdmin) {
      return "/admin/dashboard";
    }
    return null;
  }

  if (pathname.startsWith("/provider")) {
    if (!access.roles.includes("provider")) {
      return access.isAdmin
        ? "/admin/dashboard"
        : access.roles.includes("student")
          ? "/student/dashboard"
          : "/role-selection";
    }
    if (access.activeRole === "admin" && access.isAdmin) {
      return "/admin/dashboard";
    }
    return null;
  }

  if (pathname === "/role-selection") {
    const workspaceRoles = access.roles.filter((role) => role !== "admin");
    if (access.isAdmin && workspaceRoles.length === 0) {
      return "/admin/dashboard";
    }
    if (workspaceRoles.length <= 1) {
      return defaultDashboardPath(access);
    }
    return null;
  }

  return null;
}
