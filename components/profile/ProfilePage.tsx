"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Shield,
  Camera,
  Star,
} from "lucide-react";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  student_id: z.string().optional(),
  avatar_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ bookings: 0, reviews: 0, services: 0 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        bio: profile.bio || "",
        phone: profile.phone || "",
        student_id: profile.student_id || "",
        avatar_url: profile.avatar_url || "",
      });
    }
    const fetchStats = async () => {
      if (!user) return;
      const [bookings, reviews, services] = await Promise.all([
        supabase
          .from("bookings")
          .select("id", { count: "exact" })
          .or(`student_id.eq.${user.id},provider_id.eq.${user.id}`),
        supabase
          .from("reviews")
          .select("id", { count: "exact" })
          .or(`reviewer_id.eq.${user.id},provider_id.eq.${user.id}`),
        supabase
          .from("services")
          .select("id", { count: "exact" })
          .eq("provider_id", user.id),
      ]);
      setStats({
        bookings: bookings.count || 0,
        reviews: reviews.count || 0,
        services: services.count || 0,
      });
    };
    fetchStats();
  }, [profile, user, reset]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await (supabase.from("profiles") as any)
        .update({
          full_name: data.full_name,
          bio: data.bio || "",
          phone: data.phone || "",
          student_id: data.student_id || "",
          avatar_url: data.avatar_url || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Update your profile information
        </p>
      </div>

      {/* Profile header card */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {profile?.full_name}
            </h2>
            <p className="text-muted-foreground text-sm">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize text-xs">
                {profile?.role}
              </Badge>
              {profile?.is_verified && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          {[
            { label: "Bookings", value: stats.bookings },
            { label: "Reviews", value: stats.reviews },
            { label: "Services", value: stats.services },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 bg-card rounded-2xl border border-border p-6"
      >
        <h2 className="font-semibold text-foreground">Edit Information</h2>

        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="full_name"
              placeholder="Your full name"
              className="pl-10 h-11 rounded-xl"
              {...register("full_name")}
            />
          </div>
          {errors.full_name && (
            <p className="text-destructive text-xs">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID</Label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="student_id"
                placeholder="UCC/CS/2021/0001"
                className="pl-10 h-11 rounded-xl"
                {...register("student_id")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="+233 xx xxx xxxx"
                className="pl-10 h-11 rounded-xl"
                {...register("phone")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar_url">Profile Picture URL</Label>
          <div className="relative">
            <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="avatar_url"
              placeholder="https://..."
              className="pl-10 h-11 rounded-xl"
              {...register("avatar_url")}
            />
          </div>
          {errors.avatar_url && (
            <p className="text-destructive text-xs">
              {errors.avatar_url.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell other students about yourself, your skills, and what you offer..."
            className="rounded-xl resize-none"
            rows={4}
            {...register("bio")}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl shadow-primary"
          disabled={loading || !isDirty}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}

export default ProfilePage;
