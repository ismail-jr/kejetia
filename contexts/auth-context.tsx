"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { authService, RegisterPayload } from "@/lib/api/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = "student" | "provider" | "admin";

interface AuthResponse {
  roles: UserRole[];
  activeRole: UserRole | null;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [registeringEmail, setRegisteringEmail] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  // 1. Explicitly type  live database structure locally to override the outdated types file
  interface LiveProfile extends Omit<Profile, "role"> {
    role: "student" | "provider" | "admin" | null;
    active_role: "student" | "provider" | "admin" | null;
    is_admin: boolean;
  }

  // ── Unified Profile & Junction Role Loader
  const fetchProfileAndRoles = async (
    userId: string,
  ): Promise<{ profile: Profile | null; roles: UserRole[] }> => {
    // 1. Fetch the user's profile metadata
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profileData) {
      return { profile: null, roles: ["student"] };
    }

    // Cast to our verified live structure format
    const rawProfile = profileData as unknown as LiveProfile;

    // 2. Short-circuit early if they are explicitly marked as a system admin
    if (rawProfile.is_admin === true || rawProfile.role === "admin") {
      return { profile: profileData, roles: ["admin"] };
    }

    // 3. Query your live junction table to gather all assigned consumer roles
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    // Fallback to the single profile role if the junction table fetch fails
    if (rolesError || !rolesData || rolesData.length === 0) {
      const fallbackRole = (rawProfile.role as UserRole) || "student";
      return { profile: profileData, roles: [fallbackRole] };
    }

    // Map rows out into a clean string array: e.g., ["student", "provider"]
    const userRoles = rolesData.map((r: any) => r.role as UserRole);

    return { profile: profileData, roles: userRoles };
  };

  // ── Access Router Resolver
  const resolveAccess = (
    profile: Profile | null,
    userRoles: UserRole[],
  ): AuthResponse => {
    const rawProfile = profile as unknown as LiveProfile;

    const isUserAdmin =
      rawProfile?.is_admin === true || rawProfile?.role === "admin";

    if (isUserAdmin) {
      return {
        roles: ["admin"],
        activeRole: "admin",
        isAdmin: true,
      };
    }

    // If they have multiple roles (like Ismail), do not force a default activeRole yet
    // if active_role is null. This allows the Login Form to catch roles.length > 1!
    const assignedActive = rawProfile?.active_role as UserRole | null;
    const fallbackActive = userRoles.length > 1 ? null : userRoles[0];

    return {
      roles: userRoles,
      activeRole: assignedActive || fallbackActive,
      isAdmin: false,
    };
  };
  const syncUser = async (userId: string): Promise<AuthResponse> => {
    const { profile: profileData, roles: rolesData } =
      await fetchProfileAndRoles(userId);
    const access = resolveAccess(profileData, rolesData);

    setProfile(profileData);
    setRoles(access.roles);
    setActiveRole(access.activeRole);
    setIsAdmin(access.isAdmin);

    return access;
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    setIsAuthLoading(true);

    try {
      const result = await authService.signIn(email, password);

      if (result.session?.access_token) {
        const {
          data: { session: newSession },
        } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token ?? "",
        });

        setSession(newSession);
        setUser(newSession?.user ?? null);
      }

      let access: AuthResponse = {
        roles: ["student"],
        activeRole: "student",
        isAdmin: false,
      };

      if (result.user?.id) {
        access = await syncUser(result.user.id);
      }

      return access;
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

      if (result.session?.access_token) {
        const {
          data: { session: newSession },
        } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token ?? "",
        });
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }

      let access: AuthResponse = {
        roles: ["student"],
        activeRole: "student",
        isAdmin: false,
      };

      if (result.user?.id) {
        access = await syncUser(result.user.id);
      }

      return access;
    } catch (error: any) {
      toast.error(error.message || "OTP Verification failed");
      throw error;
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
    setActiveRole(null);
    setIsAdmin(false);
  };

  const refreshProfile = async () => {
    if (user?.id) await syncUser(user.id);
  };

  const setActiveRoleSafe = async (role: UserRole) => {
    if (isAdmin && role !== "admin") return;
    setActiveRole(role);

    if (user?.id) {
      await supabase
        .from("profiles")
        .update({ active_role: role } as any)
        .eq("id", user.id);
    }
  };
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await syncUser(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await syncUser(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setRoles([]);
        setActiveRole(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
        setActiveRole: setActiveRoleSafe,
        signOut,
        refreshProfile,
        isAuthLoading,
        registeringEmail,
        registerUser: async (data: RegisterPayload) => {
          setIsAuthLoading(true);
          try {
            const res = await authService.initiateRegister(data);
            setRegisteringEmail(data.email);
            toast.success(res.message);
            router.push(`/verify?email=${encodeURIComponent(data.email)}`);
          } finally {
            setIsAuthLoading(false);
          }
        },
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
