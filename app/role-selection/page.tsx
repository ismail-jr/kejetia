"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { User, Store } from "lucide-react";
import Image from "next/image";

export default function RoleSelectionPage() {
  const { roles, setActiveRole, user, loading } = useAuth();
  const router = useRouter();

  // Guard: If authentication finishes loading and user is missing, return to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleSelectWorkspace = async (chosenRole: "student" | "provider") => {
    await setActiveRole(chosenRole);

    router.replace(`/${chosenRole}/dashboard`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading profiles...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl text-center space-y-3 mb-8">
        <div className="flex justify-center mb-4">
          <div className="relative w-12 h-12">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              sizes="(max-w-768px) 100vw, 33vw"
              className="object-contain"
            />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Choose your workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          Your UCC account is linked to multiple profiles. Select which
          workspace you want to open for this session.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
        {/* Student Workspace */}
        {roles.includes("student") && (
          <button
            onClick={() => handleSelectWorkspace("student")}
            className="group flex flex-col items-center p-8 bg-card border border-border rounded-2xl hover:border-primary text-center transition-all hover:shadow-md outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground">
              Student Portal
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Browse campus listings, buy services, and manage your account.
            </p>
          </button>
        )}

        {/* Provider Workspace */}
        {roles.includes("provider") && (
          <button
            onClick={() => handleSelectWorkspace("provider")}
            className="group flex flex-col items-center p-8 bg-card border border-border rounded-2xl hover:border-green-500 text-center transition-all hover:shadow-md outline-none focus:ring-2 focus:ring-green-500"
          >
            <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-lg text-foreground">
              Service Provider
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Manage your business store, list services, and fulfill client
              contracts.
            </p>
          </button>
        )}
      </div>

      {/* Unlock the other role on the same UCC email */}
      {(!roles.includes("student") || !roles.includes("provider")) && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {!roles.includes("provider")
              ? "Want to offer services on campus?"
              : "Want to browse and book peer services?"}
          </p>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/register?role=${!roles.includes("provider") ? "provider" : "student"}`,
              )
            }
            className="text-sm font-semibold text-primary hover:underline"
          >
            Unlock {!roles.includes("provider") ? "Provider" : "Student"} role
            on this account
          </button>
        </div>
      )}
    </div>
  );
}
