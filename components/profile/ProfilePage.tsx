"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
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

  const targetRole = forcedRole || activeRole || "student";

  const handleUpdateProfile = async (formPayload: any) => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Fall back safely to existing profile avatar URL instead of null
      const resolvedAvatarUrl =
        formPayload.avatar_url || profile?.avatar_url || null;

      const baseUpdate: any = {
        full_name: formPayload.full_name,
        phone: formPayload.phone || null,
        location: formPayload.location || null,
        bio: formPayload.bio || "",
        avatar_url: resolvedAvatarUrl,
        student_id: formPayload.student_id || null,
        updated_at: new Date().toISOString(),
      };

      if (targetRole === "provider" || targetRole === "admin") {
        baseUpdate.momo_number = formPayload.momo_number || null;
        baseUpdate.momo_name = formPayload.momo_name || null;
        baseUpdate.momo_network = formPayload.momo_network || null;
        baseUpdate.available_days = formPayload.available_days || [];
        baseUpdate.available_time =
          formPayload.available_time || "08:00 AM - 05:00 PM";
      }

      const { error } = await supabase
        .from("profiles")
        .update(baseUpdate)
        .eq("user_id", user.id);

      if (error) throw error;

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

      {targetRole === "provider" || targetRole === "admin" ? (
        <ProviderProfile
          initialData={profile}
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
