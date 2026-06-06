"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, BookOpen, Phone, MapPin, Loader2 } from "lucide-react";

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { FormField } from "@/components/profile/form-field";
import { ProviderFields } from "@/components/profile/provider-fields";

// ── Schemas
const baseSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val.replace(/[\s+-]/g, "")), {
      message: "Phone number must contain only digits",
    }),
  location: z.string().optional(),
});

const studentSchema = baseSchema.extend({
  student_id: z.string().min(3, "Student ID is required"),
});

const providerSchema = baseSchema.extend({
  student_id: z.string().optional(),
  service_category: z.string().optional(),
  service_rate: z.string().optional(),
  availability: z.string().optional(),
  portfolio_url: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
});

type FormData = z.infer<typeof studentSchema> & z.infer<typeof providerSchema>;

export default function ProfilePage() {
  const { user, profile, activeRole, refreshProfile } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const isStudentRoute = pathname?.includes("/student");

  const currentRole = isStudentRoute
    ? "student"
    : (activeRole ?? (profile?.role as "student" | "provider") ?? "student");

  const isProvider = currentRole === "provider";

  const schema = isProvider ? providerSchema : studentSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  const bioValue = watch("bio") ?? "";

  useEffect(() => {
    if (!user) return;
    reset({
      full_name: profile?.full_name || user.user_metadata?.full_name || "",
      student_id: profile?.student_id || user.user_metadata?.student_id || "",
      bio: profile?.bio || "",
      phone: profile?.phone ? String(profile.phone) : "",
      location: profile?.location || "",
      service_category: (profile as any)?.service_category || "",
      service_rate: (profile as any)?.service_rate || "",
      availability: (profile as any)?.availability || "",
      portfolio_url: (profile as any)?.portfolio_url || "",
    });
  }, [profile, user, reset, currentRole]);

  const onSubmit: SubmitHandler<FieldValues> = async (rawValues) => {
    if (!user) return;
    setLoading(true);
    const data = rawValues as FormData;

    try {
      const phoneNum = data.phone
        ? Number(data.phone.replace(/[\s+-]/g, ""))
        : null;
      const payload: Record<string, any> = {
        id: user.id,
        email: user.email ?? "",
        full_name: data.full_name,
        bio: data.bio ?? "",
        phone: phoneNum,
        location: data.location ?? null,
        updated_at: new Date().toISOString(),
      };

      if (!isProvider) payload.student_id = data.student_id ?? null;
      if (isProvider) {
        payload.service_category = data.service_category ?? null;
        payload.service_rate = data.service_rate ?? null;
        payload.availability = data.availability ?? null;
        payload.portfolio_url = data.portfolio_url || null;
      }

      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;

      await refreshProfile();
      toast.success("Profile saved!");
      reset(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ProfileHeader isProvider={isProvider} currentRole={currentRole} />

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-1 space-y-4">
          <ProfileCard
            user={user}
            profile={profile}
            isProvider={isProvider}
            currentRole={currentRole}
            refreshProfile={refreshProfile}
          />
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  id="full_name"
                  label={isProvider ? "Display Name" : "Full Name"}
                  required
                  error={errors.full_name?.message}
                  icon={<User className="w-4 h-4 text-muted-foreground" />}
                >
                  <Input
                    id="full_name"
                    placeholder={
                      isProvider ? "e.g. Kojo Designs" : "Your full name"
                    }
                    className="pl-10 h-11 rounded-xl"
                    {...register("full_name")}
                  />
                </FormField>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    id="student_id"
                    label="Student Index No."
                    required={!isProvider}
                    error={errors.student_id?.message}
                    hint={
                      isProvider
                        ? "Links your provider account to your student ID"
                        : undefined
                    }
                    icon={
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    }
                  >
                    <Input
                      id="student_id"
                      placeholder="PS/ITC/22/0001"
                      className="pl-10 h-11 rounded-xl"
                      {...register("student_id")}
                    />
                  </FormField>

                  <FormField
                    id="phone"
                    label="Phone Number"
                    error={errors.phone?.message}
                    icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                  >
                    <Input
                      id="phone"
                      placeholder="0541234567"
                      className="pl-10 h-11 rounded-xl"
                      {...register("phone")}
                    />
                  </FormField>
                </div>

                <FormField
                  id="location"
                  label={isProvider ? "Service Area" : "Hostel / Location"}
                  icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                >
                  <Input
                    id="location"
                    placeholder={
                      isProvider
                        ? "e.g. Science Market, Casford Hall area"
                        : "e.g. Atlantic Hall, Room 302"
                    }
                    className="pl-10 h-11 rounded-xl"
                    {...register("location")}
                  />
                </FormField>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio" className="text-sm font-medium">
                      {isProvider ? "Service Description" : "About Me"}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {bioValue.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="bio"
                    placeholder={
                      isProvider
                        ? "Describe what you offer..."
                        : "Tell the campus community..."
                    }
                    className="rounded-xl resize-none min-h-[110px]"
                    rows={4}
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <p className="text-destructive text-xs">
                      {errors.bio.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {isProvider && (
              <ProviderFields register={register} errors={errors} />
            )}

            <Button
              type="submit"
              className={`w-full h-11 rounded-xl font-medium transition-all ${isProvider ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white" : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"}`}
              disabled={loading || !isDirty}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                `Save ${isProvider ? "Provider" : "Student"} Profile`
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
