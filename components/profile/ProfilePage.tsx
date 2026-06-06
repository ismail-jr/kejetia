"use client";

import { useEffect, useState, useRef } from "react";
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
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Camera,
  Loader2,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500).optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val.replace(/[\s+-]/g, "")), {
      message: "Phone number must contain only numbers",
    }),
  student_id: z.string().optional(),
  location: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Track what view mode the user is physically looking at right now
  // If your routing handles this, you can replace this state with your URL param or hook!
  const [currentViewRole, setCurrentViewRole] = useState<
    "student" | "provider"
  >("student");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const metaName = user?.user_metadata?.full_name || "";
  const metaStudentId = user?.user_metadata?.student_id || "";

  //  Detect context role view state from current profile settings on load
  useEffect(() => {
    if (profile?.role) {
      setCurrentViewRole(profile.role as "student" | "provider");
    }
  }, [profile]);

  // Load inputs cleanly based on the active structural view mode selected
  useEffect(() => {
    if (user) {
      reset({
        full_name: profile?.full_name || user?.user_metadata?.full_name || "",
        student_id:
          profile?.student_id || user?.user_metadata?.student_id || "",
        // If viewing provider dashboard, we can prefix or decouple local storage variables
        bio: profile?.bio || "",
        phone: profile?.phone ? String(profile.phone) : "",
        location: profile?.location || "",
      });
    }
  }, [profile, user, reset, currentViewRole]);

  const parsePhoneToNumeric = (value?: string) => {
    if (!value) return null;
    const cleanDigits = value.replace(/[\s+-]/g, "");
    return cleanDigits ? Number(cleanDigits) : null;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || "",
        full_name: profile?.full_name || metaName || "User",
        avatar_url: avatarUrl,
        active_role: currentViewRole,
        updated_at: new Date().toISOString(),
      });

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success("Profile picture updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      //  FIX: Upsert changes safely while explicitly logging the active view state.
      // If you decide to add role specific metadata columns later, add them directly below!
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || "",
        full_name: data.full_name,
        bio: data.bio || "",
        phone: parsePhoneToNumeric(data.phone),
        student_id: data.student_id || null,
        location: data.location || null,
        active_role: currentViewRole,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await refreshProfile();
      toast.success(`Updated successfully as a ${currentViewRole}!`);
      reset(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile modifications");
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.full_name || metaName || "User Name";
  const displayEmail = profile?.email || user?.email || "";
  const displayBio = profile?.bio || "";

  const isProvider = currentViewRole === "provider";

  const initials =
    displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="space-y-6">
      {/* Mock Toggle Action Layout - Helps test state transitions locally on your page */}
      <div className="flex justify-end items-center gap-3 bg-card border p-3 rounded-xl shadow-sm">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          Workspace Context:
        </span>
        <Button
          variant={!isProvider ? "default" : "outline"}
          size="sm"
          className="rounded-lg h-8 text-xs"
          onClick={() => setCurrentViewRole("student")}
        >
          <GraduationCap className="w-3.5 h-3.5 mr-1" /> Student View
        </Button>
        <Button
          variant={isProvider ? "default" : "outline"}
          size="sm"
          className="rounded-lg h-8 text-xs text-amber-600 border-amber-500/20 hover:bg-amber-500/10"
          onClick={() => setCurrentViewRole("provider")}
        >
          <Briefcase className="w-3.5 h-3.5 mr-1" /> Provider View
        </Button>
      </div>

      {/* Dynamic Header Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-muted/30 p-5 rounded-2xl border border-border/40">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-foreground flex items-center gap-2">
            {isProvider ? "Service Provider Profile" : "Student Profile"}
            {isProvider && (
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isProvider
              ? "Manage your campus service listings, workspace locations, and client contact configurations."
              : "Manage your personal information, request histories, and campus housing coordinates."}
          </p>
        </div>

        <div className="self-start sm:self-center">
          <Badge
            className={`px-4 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider shadow-sm border-0 ${
              isProvider
                ? "bg-amber-500 text-white dark:bg-amber-600"
                : "bg-primary text-primary-foreground"
            }`}
          >
            Viewing as {currentViewRole}
          </Badge>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Sidebar Card */}
        <div className="lg:col-span-1">
          <Card
            className={`rounded-2xl p-6 border transition-all duration-300 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl ${
              isProvider
                ? "border-amber-500/20 shadow-amber-500/[0.02]"
                : "border-border/60"
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* Avatar Section */}
              <div className="relative group">
                <div
                  className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r ${
                    isProvider
                      ? "from-amber-500 to-amber-300"
                      : "from-primary to-primary/50"
                  }`}
                />
                <Avatar
                  className={`w-28 h-28 ring-4 shadow-xl transition-transform duration-300 group-hover:scale-105 ${
                    isProvider ? "ring-amber-500/30" : "ring-primary/20"
                  }`}
                >
                  <AvatarImage
                    src={profile?.avatar_url || ""}
                    className="object-cover"
                  />
                  <AvatarFallback
                    className={`text-white text-2xl font-bold font-serif bg-gradient-to-br ${
                      isProvider
                        ? "from-amber-500 to-amber-600"
                        : "from-primary to-primary/80"
                    }`}
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
                  className={`absolute -bottom-1 -right-1 rounded-full p-2 text-white shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 ${
                    isProvider ? "bg-amber-500" : "bg-primary"
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Identity Headers */}
              <div className="mt-5 space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground font-serif">
                  {displayName}
                </h2>
                <p
                  className={`text-sm font-medium flex items-center justify-center gap-1.5 capitalize ${
                    isProvider
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-primary/80"
                  }`}
                >
                  {isProvider ? (
                    <Briefcase className="w-3.5 h-3.5" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5" />
                  )}
                  Active Mode: {currentViewRole}
                </p>
              </div>

              {displayBio && (
                <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed italic">
                  "{displayBio}"
                </p>
              )}

              {/* Data parameters list */}
              <div className="w-full mt-6 pt-6 border-t border-border/60 text-left space-y-3.5 text-sm">
                {displayEmail && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                    <span className="truncate font-medium">{displayEmail}</span>
                  </div>
                )}
                {(profile?.student_id || metaStudentId) && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <BookOpen className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                    <span className="font-medium">
                      Index No: {profile?.student_id || metaStudentId}
                    </span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                    <span className="font-medium">{String(profile.phone)}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                    <span className="font-medium">
                      {isProvider
                        ? `Operating Area: ${profile.location}`
                        : `Campus Address: ${profile.location}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Card className="rounded-2xl p-6 shadow-md border-border/60">
              <h2 className="text-xl font-bold mb-5 font-serif text-foreground">
                {isProvider
                  ? "Update Provider Directory Listing"
                  : "Update Profile Particulars"}
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    {isProvider ? "Business or Provider Name" : "Full Name"}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      placeholder={
                        isProvider
                          ? "e.g., Kojo Graphics"
                          : "Your official name"
                      }
                      className="pl-10 h-11 rounded-xl"
                      {...register("full_name")}
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-destructive text-xs mt-0.5">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_id" className="text-sm font-medium">
                      Student Index / Reference Number
                    </Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="student_id"
                        placeholder="PS/ITC/22/0001"
                        className="pl-10 h-11 rounded-xl"
                        {...register("student_id")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Contact Line (Digits Only)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="e.g., 0541234567"
                        className="pl-10 h-11 rounded-xl"
                        {...register("phone")}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-0.5">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    {isProvider
                      ? "Primary Service Delivery Area"
                      : "Hostel / Campus Location"}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder={
                        isProvider
                          ? "e.g., Science Market, Casford"
                          : "e.g., Atlantic Hall, Room 302"
                      }
                      className="pl-10 h-11 rounded-xl"
                      {...register("location")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">
                    {isProvider
                      ? "Service Description & Offerings"
                      : "About Me"}
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder={
                      isProvider
                        ? "Detail your skills, base pricing structural rates..."
                        : "Introduce yourself to the UCC student community..."
                    }
                    className="rounded-xl resize-none min-h-[120px]"
                    rows={4}
                    {...register("bio")}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full h-11 rounded-xl mt-6 font-medium shadow-sm transition-all duration-200 ${
                  isProvider
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                    : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                }`}
                disabled={loading || !isDirty}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isProvider ? (
                  "Update Provider Dashboard"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
