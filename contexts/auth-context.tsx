"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { authService, RegisterPayload } from "@/lib/api/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type UserRole = "student" | "provider" | "admin";

interface AuthResponse {
  roles: UserRole[];
  activeRole: UserRole;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  roles: UserRole[];
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthLoading: boolean;
  registeringEmail: string;
  registerUser: (data: RegisterPayload) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Generic timeout wrapper so a hung promise can never freeze the UI forever
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [registeringEmail, setRegisteringEmail] = useState("");

  // ── Fetch profile by auth user id
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("fetchProfile error:", error.message);
      return null;
    }
    return data as Profile | null;
  };

  // ── Sync all auth state from a loaded profile
  const applyProfile = (p: Profile): AuthResponse => {
    const validRoles = (p.roles ?? []).filter((r) =>
      ["student", "provider", "admin"].includes(r),
    ) as UserRole[];

    const determinedRoles =
      validRoles.length > 0 ? validRoles : ["student" as UserRole];

    const determinedActive =
      p.active_role && ["student", "provider", "admin"].includes(p.active_role)
        ? (p.active_role as UserRole)
        : (determinedRoles[0] as UserRole);

    const adminFlag = p.is_admin === true || determinedRoles.includes("admin");

    setProfile(p);
    setRoles(determinedRoles);
    setActiveRoleState(determinedActive);
    setIsAdmin(adminFlag);

    return {
      roles: determinedRoles,
      activeRole: determinedActive,
      isAdmin: adminFlag,
    };
  };

  const syncUser = async (userId: string): Promise<AuthResponse> => {
    const p = await fetchProfile(userId);
    if (!p) {
      setProfile(null);
      setRoles(["student"]);
      setActiveRoleState("student");
      setIsAdmin(false);
      return { roles: ["student"], activeRole: "student", isAdmin: false };
    }
    return applyProfile(p);
  };

  const setActiveRole = async (role: UserRole) => {
    if (!user?.id) return;
    if (!roles.includes(role)) {
      console.warn(`Role switch rejected — user does not have role: ${role}`);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ active_role: role, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      console.error("setActiveRole DB error:", error.message);
      return;
    }

    setActiveRoleState(role);
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    setIsAuthLoading(true);
    try {
      const result = await authService.signIn(email, password);

      if (!result.user) {
        throw new Error("Authentication payload missing user details.");
      }

      if (result.session?.access_token) {
        const {
          data: { session: newSession },
          error,
        } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token ?? "",
        });
        if (error) throw new Error(error.message);
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }

      const rawUser = result.user;
      const determinedRoles = (rawUser.roles || ["student"]) as UserRole[];

      const determinedActive = (rawUser.active_role ||
        rawUser.activeRole ||
        determinedRoles[0] ||
        "student") as UserRole;
      const adminFlag =
        rawUser.is_admin === true ||
        rawUser.isAdmin === true ||
        determinedRoles.includes("admin");

      setRoles(determinedRoles);
      setActiveRoleState(determinedActive);
      setIsAdmin(adminFlag);

      fetchProfile(rawUser.id).then((p) => {
        if (p) setProfile(p);
      });

      return {
        roles: determinedRoles,
        activeRole: determinedActive,
        isAdmin: adminFlag,
      };
    } catch (error) {
      console.error("Context signIn error execution:", error);
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const verifyOtp = async (
    email: string,
    token: string,
  ): Promise<AuthResponse> => {
    setIsAuthLoading(true);
    try {
      const result = await authService.verifyRegister(email, token);

      if (!result.user) {
        throw new Error("Verification payload missing user details.");
      }

      if (result.session?.access_token) {
        const {
          data: { session: newSession },
          error,
        } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token ?? "",
        });
        if (error) throw new Error(error.message);
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }

      const rawUser = result.user;
      const determinedRoles = (rawUser.roles || ["student"]) as UserRole[];
      const determinedActive = (rawUser.active_role ||
        rawUser.activeRole ||
        determinedRoles[0] ||
        "student") as UserRole;
      const adminFlag =
        rawUser.is_admin === true ||
        rawUser.isAdmin === true ||
        determinedRoles.includes("admin");

      setRoles(determinedRoles);
      setActiveRoleState(determinedActive);
      setIsAdmin(adminFlag);

      fetchProfile(rawUser.id).then((p) => {
        if (p) setProfile(p);
      });

      return {
        roles: determinedRoles,
        activeRole: determinedActive,
        isAdmin: adminFlag,
      };
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed");
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const registerUser = async (data: RegisterPayload) => {
    setIsAuthLoading(true);
    try {
      const res = await authService.initiateRegister(data);
      setRegisteringEmail(data.email);
      toast.success(res.message || "Verification code sent!");
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setRoles([]);
    setActiveRoleState(null);
    setIsAdmin(false);
    setRegisteringEmail("");
  };

  const refreshProfile = async () => {
    if (user?.id) await syncUser(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const {
          data: { session: s },
        } = await withTimeout(supabase.auth.getSession(), 8000, "getSession");
        if (!mounted) return;

        if (s?.user) {
          setSession(s);
          setUser(s.user);
          // Await profile sync completely before lowering loading state,
          // but guarded by a timeout so a hung query can't freeze the app.
          try {
            await withTimeout(syncUser(s.user.id), 8000, "syncUser (init)");
          } catch (err) {
            console.error("Profile sync timed out/failed on init:", err);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // NOTE: this callback intentionally does NOT call other Supabase async
    // methods directly in its body — doing so can deadlock the auth client,
    // since Supabase holds an internal lock while processing the state
    // change event. Any follow-up Supabase calls are deferred via
    // setTimeout(..., 0) so they run after the lock is released.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setLoading(true);
      }

      if (s?.user) {
        setSession(s);
        setUser(s.user);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Defer the profile sync out of this callback's call stack
          setTimeout(async () => {
            if (!mounted) return;
            try {
              await withTimeout(
                syncUser(s.user.id),
                8000,
                "syncUser (auth change)",
              );
            } catch (err) {
              console.error(
                "Profile sync timed out/failed on auth change:",
                err,
              );
            } finally {
              if (mounted) setLoading(false);
            }
          }, 0);
          return; // loading is lowered inside the deferred block above
        }
      } else {
        // Reset state completely if unauthenticated
        setSession(null);
        setUser(null);
        setProfile(null);
        setRoles([]);
        setActiveRoleState(null);
        setIsAdmin(false);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin,
        roles,
        activeRole,
        setActiveRole,
        signOut,
        refreshProfile,
        isAuthLoading,
        registeringEmail,
        registerUser,
        verifyOtp,
        signIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
