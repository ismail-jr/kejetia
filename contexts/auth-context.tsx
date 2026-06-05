"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { authService, RegisterPayload } from "@/lib/api/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = "student" | "provider";

interface AuthContextType {
  // Session
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // Multi-role
  roles: UserRole[]; // all roles this account has, e.g. ["student", "provider"]
  activeRole: UserRole | null; // the role currently in use
  setActiveRole: (role: UserRole) => void;

  // Custom API
  isAuthLoading: boolean;
  registeringEmail: string;
  registerUser: (data: RegisterPayload) => Promise<void>;
  verifyOtp: (
    email: string,
    token: string,
  ) => Promise<{ roles: UserRole[]; activeRole: UserRole | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ roles: UserRole[]; activeRole: UserRole | null } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Multi-role state
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  // Custom API state
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [registeringEmail, setRegisteringEmail] = useState("");

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setRoles([]);
    setActiveRole(null);
    setRegisteringEmail("");
  };

  // ── Register (unchanged flow) ────────────────────────────────────────────────
  const registerUser = async (data: RegisterPayload) => {
    setIsAuthLoading(true);
    try {
      const result = await authService.initiateRegister(data);
      setRegisteringEmail(data.email);
      toast.success(result.message || "Verification code sent!");
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      toast.error(error.message || "Registration failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ── Verify OTP — now returns roles array ────────────────────────────────────
  const verifyOtp = async (email: string, token: string) => {
    const result = await authService.verifyRegister(email, token);

    // Hydrate Supabase client session
    const accessToken = result.session?.access_token ?? result.token ?? "";
    const refreshToken =
      result.session?.refresh_token ?? result.refreshToken ?? "";

    if (accessToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError)
        throw new Error(`Session error: ${sessionError.message}`);
    }

    // Backend now returns roles array; fall back gracefully if older shape
    const userRoles: UserRole[] =
      result.user?.roles ?? (result.role ? [result.role] : ["student"]);
    const decided: UserRole | null =
      userRoles.length === 1 ? userRoles[0] : null;

    setRoles(userRoles);
    setActiveRole(decided);

    return { roles: userRoles, activeRole: decided };
  };

  // ── Sign in — backend returns roles array ────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    setIsAuthLoading(true);
    try {
      // Call your custom backend sign-in endpoint (returns roles array)
      const result = await authService.signIn(email, password);

      // Hydrate Supabase client with the session your backend returned
      if (result.session?.access_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token ?? "",
        });
        if (sessionError) throw new Error(sessionError.message);
      }

      const userRoles: UserRole[] = result.user?.roles ?? ["student"];
      const decided: UserRole | null =
        result.user?.activeRole ??
        (userRoles.length === 1 ? userRoles[0] : null);

      setRoles(userRoles);
      setActiveRole(decided);

      return { roles: userRoles, activeRole: decided };
    } catch (error: any) {
      throw error;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ── Session listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
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
        signOut,
        refreshProfile,
        roles,
        activeRole,
        setActiveRole,
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
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
