"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  BookOpen,
  Phone,
  MapPin,
  Tag,
  Clock,
  Globe,
  Camera,
  Loader2,
} from "lucide-react";

interface ProfileCardProps {
  user: any;
  profile: any;
  isProvider: boolean;
  currentRole: string;
  refreshProfile: () => Promise<void>;
}

export function ProfileCard({
  user,
  profile,
  isProvider,
  currentRole,
  refreshProfile,
}: ProfileCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (dbErr) throw dbErr;

      await refreshProfile();
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const initials =
    displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <Card className="rounded-2xl overflow-hidden">
      <div
        className={`h-20 w-full ${isProvider ? "bg-gradient-to-r from-amber-500/80 to-amber-400/60" : "bg-gradient-to-r from-primary/80 to-primary/50"}`}
      />
      <CardContent className="px-5 pb-5 -mt-10">
        <div className="relative w-fit mx-auto mb-4">
          <Avatar
            className={`w-20 h-20 ring-4 ring-card shadow-lg ${isProvider ? "ring-amber-100 dark:ring-amber-900/30" : ""}`}
          >
            <AvatarImage
              src={profile?.avatar_url ?? ""}
              className="object-cover"
            />
            <AvatarFallback
              className={`text-white text-lg font-bold ${isProvider ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-gradient-to-br from-primary to-primary/80"}`}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`absolute -bottom-0.5 -right-0.5 rounded-full p-1.5 text-white shadow-md hover:scale-110 transition-transform disabled:opacity-50 ${isProvider ? "bg-amber-500" : "bg-primary"}`}
          >
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
          </button>
        </div>

        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-foreground leading-tight">
            {displayName}
          </h2>
          <p
            className={`text-xs font-medium mt-1 capitalize ${isProvider ? "text-amber-600 dark:text-amber-400" : "text-primary/70"}`}
          >
            {currentRole}
          </p>
          {profile?.bio && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed italic line-clamp-3">
              "{profile.bio}"
            </p>
          )}
        </div>

        <Separator className="mb-4" />

        <div className="space-y-2.5 text-sm">
          {displayEmail && (
            <InfoRow
              icon={<Mail className="w-3.5 h-3.5" />}
              value={displayEmail}
            />
          )}
          {(profile?.student_id || user?.user_metadata?.student_id) && (
            <InfoRow
              icon={<BookOpen className="w-3.5 h-3.5" />}
              value={profile?.student_id || user?.user_metadata?.student_id}
              label="Index No"
            />
          )}
          {profile?.phone && (
            <InfoRow
              icon={<Phone className="w-3.5 h-3.5" />}
              value={String(profile.phone)}
            />
          )}
          {profile?.location && (
            <InfoRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              value={profile.location}
            />
          )}
          {isProvider && (profile as any)?.service_category && (
            <InfoRow
              icon={<Tag className="w-3.5 h-3.5" />}
              value={(profile as any).service_category}
              label="Category"
            />
          )}
          {isProvider && (profile as any)?.availability && (
            <InfoRow
              icon={<Clock className="w-3.5 h-3.5" />}
              value={(profile as any).availability}
              label="Available"
            />
          )}
          {isProvider && (profile as any)?.portfolio_url && (
            <a
              href={(profile as any).portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline text-xs"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Portfolio / Website</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="shrink-0 text-muted-foreground/60">{icon}</span>
      <span className="truncate text-xs">
        {label && (
          <span className="text-muted-foreground/60 mr-1">{label}:</span>
        )}
        {value}
      </span>
    </div>
  );
}
