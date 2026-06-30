"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  updateIdentity,
  upsertProviderProfile,
  getProviderProfile,
} from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import StudentProfile from "@/components/profile/student-profile";
import ProviderProfile from "@/components/profile/provider-profile";

interface ProfilePageProps {
  forcedRole?: "student" | "provider" | "admin";
}

export default function ProfilePage({ forcedRole }: ProfilePageProps) {
  const { user, profile, activeRole, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  // Provider-only fields now live in provider_profiles, so they are
  // fetched separately and merged into the form's initial data.
  const [providerExt, setProviderExt] = useState<Record<string, any> | null>(
    null,
  );

  const targetRole = forcedRole || activeRole || "student";
  const isProviderView = targetRole === "provider" || targetRole === "admin";

  useEffect(() => {
    if (!user?.id || !isProviderView) return;
    let active = true;
    getProviderProfile(user.id)
      .then((ext) => {
        if (active) setProviderExt(ext);
      })
      .catch((err) => console.error("Failed to load provider profile:", err));
    return () => {
      active = false;
    };
  }, [user?.id, isProviderView]);

  // Merge identity + provider extension so the provider form prefills the
  // momo/availability fields that moved out of profiles.
  const mergedInitialData = providerExt
    ? { ...(profile as any), ...providerExt }
    : profile;

  const handleUpdateProfile = async (formPayload: any) => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Fall back safely to existing profile avatar URL instead of null
      const resolvedAvatarUrl =
        formPayload.avatar_url || profile?.avatar_url || null;

      // Identity fields → profiles
      await updateIdentity(user.id, {
        full_name: formPayload.full_name,
        phone: formPayload.phone || null,
        location: formPayload.location || null,
        bio: formPayload.bio || "",
        avatar_url: resolvedAvatarUrl,
        student_id: formPayload.student_id || null,
      });

      // Provider-only fields → provider_profiles
      if (isProviderView) {
        await upsertProviderProfile(user.id, {
          momo_number: formPayload.momo_number || null,
          momo_name: formPayload.momo_name || null,
          momo_network: formPayload.momo_network || null,
          available_days: formPayload.available_days || [],
          available_time:
            formPayload.available_time || "08:00 AM - 05:00 PM",
        });
      }

      await refreshProfile();
      toast.success("Profile information updated successfully!");
    } catch (err: any) {
      console.error("Profile specification persistence failure details:");
      console.dir(err);

      const errorString =
        (JSON.stringify(err) || "") + (err?.message || "") + (err?.code || "");

      const isDuplicateStudentId =
        errorString.includes("profiles_student_id_unique_idx") ||
        err?.code === "23505" ||
        err?.status === 409 ||
        err?.statusCode === 409;

      if (isDuplicateStudentId) {
        throw {
          code: "23505",
          message: err?.message || "profiles_student_id_unique_idx",
          status: 409,
        };
      }

      toast.error(err.message || "Failed to commit information changes.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading">
          Account Information
        </h1>
        <p className="text-muted-foreground mt-1">
          Review or update your profile details.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <Avatar className="w-20 h-20 border border-border">
          <AvatarImage
            src={profile?.avatar_url ?? ""}
            alt={profile?.full_name ?? "Account User"}
          />
          <AvatarFallback className="bg-muted text-transparent rounded-full animate-pulse">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground font-heading">
            {profile?.full_name || "Kejetia User"}
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            {profile?.email ?? user?.email}
          </p>
          <div className="pt-1">
            <Badge
              variant="secondary"
              className="capitalize text-xs font-semibold"
            >
              Current Portal view: {targetRole} Mode
            </Badge>
          </div>
        </div>
      </div>

      {isProviderView ? (
        <ProviderProfile
          initialData={mergedInitialData}
          onSave={handleUpdateProfile}
          loading={loading}
        />
      ) : (
        <StudentProfile
          initialData={profile}
          onSave={handleUpdateProfile}
          loading={loading}
        />
      )}
    </div>
  );
}
