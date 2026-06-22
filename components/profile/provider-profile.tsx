// B:\Projects\kejetia\components\profile\provider-profile.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Phone,
  BookOpen,
  MapPin,
  UploadCloud,
  CreditCard,
  CalendarDays,
  Clock,
  Loader2,
  Eye,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const providerSchema = z.object({
  full_name: z.string().min(2, "Business or full name must be valid"),
  student_id: z
    .string()
    .min(1, "Student ID reference is required for verification"),
  phone: z.string().min(9, "Enter a valid phone contact layout"),
  location: z.string().min(2, "Operational base address required"),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  avatar_url: z.string().optional().or(z.literal("")),
  momo_number: z.string().min(9, "Payout number required"),
  momo_name: z.string().min(2, "Registered MoMo Subscriber Name required"),
  momo_network: z.enum(["MTN", "Telecel", "AirtelTigo"] as const, {
    message: "Select either MTN, Telecel, or AirtelTigo",
  }),
  available_days: z
    .array(z.string())
    .min(1, "Select at least one operating day"),
  available_time: z
    .string()
    .min(
      2,
      "Provide a brief description of your active times (e.g., 8am - 4pm)",
    ),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface ProviderProfileProps {
  initialData: any;
  onSave: (data: any) => Promise<void>;
  loading: boolean;
  userId?: string; // Add userId prop for preview link
}

export default function ProviderProfile({
  initialData,
  onSave,
  loading: externalLoading,
  userId,
}: ProviderProfileProps) {
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    reset,
    setError,
    control,
    formState: { errors, isDirty },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      student_id: initialData?.student_id || "",
      phone: initialData?.phone || "",
      location: initialData?.location || "",
      bio: initialData?.bio || "",
      avatar_url: initialData?.avatar_url || "",
      momo_number: initialData?.momo_number || "",
      momo_name: initialData?.momo_name || "",
      momo_network: initialData?.momo_network || "MTN",
      available_time: initialData?.available_time || "08:00 AM - 05:00 PM",
      available_days: initialData?.available_days || [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        full_name: initialData.full_name || "",
        student_id: initialData.student_id || "",
        phone: initialData.phone || "",
        location: initialData.location || "",
        bio: initialData.bio || "",
        avatar_url: initialData.avatar_url || "",
        momo_number: initialData.momo_number || "",
        momo_name: initialData.momo_name || "",
        momo_network: initialData.momo_network || "MTN",
        available_time: initialData.available_time || "08:00 AM - 05:00 PM",
        available_days: initialData.available_days || [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
      });
    }
  }, [initialData, reset]);

  const currentAvatarUrl = watch("avatar_url");

  const handleFormSubmit = async (formData: ProviderFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(formData);
      setIsSubmitting(false);
    } catch (error: any) {
      console.error("Intercepted provider save exception details:", error);

      const errorString =
        (JSON.stringify(error) || "") +
        (error?.message || "") +
        (error?.code || "");
      const isDuplicate =
        errorString.includes("profiles_student_id_unique_idx") ||
        error?.code === "23505" ||
        error?.status === 409;

      if (isDuplicate) {
        setError(
          "student_id",
          {
            type: "manual",
            message:
              "This Student ID is already registered to another account.",
          },
          { shouldFocus: true },
        );
        toast.error(
          "Save Failed: The provided Student ID has already been claimed.",
        );
        setIsSubmitting(false);
        return;
      }

      toast.error(
        error?.message || "An unexpected error occurred while saving.",
      );
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG/JPEG)");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file must be under 2MB");
        return;
      }

      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const filePath = `provider-${uniqueId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { data: sessionData } = await supabase.auth.getUser();
      if (sessionData?.user?.id) {
        const { error: dbError } = await supabase
          .from("profiles")
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", sessionData.user.id);

        if (dbError) throw dbError;

        const currentFormValues = getValues();
        reset({ ...currentFormValues, avatar_url: publicUrl });
      }

      toast.success("Brand logo updated successfully!");
    } catch (error: any) {
      console.error("Upload process error log:", error);
      toast.error(error.message || "Failed to save file layout.");
    } finally {
      setUploading(false);
    }
  };

  const initials =
    watch("full_name")
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PV";
  const isLoading = externalLoading || isSubmitting;

  // Get the user ID for the preview link - use userId prop or try to get from initialData
  const previewUserId = userId || initialData?.user_id || initialData?.id;

  return (
    <div className="space-y-6">
      {/* Preview Public Profile Button */}
      {previewUserId && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                Public Profile Preview
              </p>
              <p className="text-xs text-muted-foreground">
                See how your profile appears to students and clients
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/10"
            asChild
          >
            <Link
              href={`/provider/profile/preview/${previewUserId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Preview Profile
            </Link>
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Provider Business Details */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-foreground font-heading text-lg">
            Provider Business Details
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-muted/20 border border-border/40">
            <Avatar className="w-20 h-20 border border-border rounded-xl">
              <AvatarImage
                src={currentAvatarUrl}
                alt="Provider Logo"
                className="object-cover"
              />
              <AvatarFallback className="bg-muted text-transparent rounded-xl animate-pulse">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5 flex-1 w-full text-center sm:text-left">
              <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block">
                Service Brand Logo
              </Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
                disabled={uploading || isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl font-medium text-xs gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isLoading}
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                Upload Logo Asset
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Supports JPEG, PNG up to 2MB.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="full_name"
                className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
              >
                Business / Provider Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input
                  id="full_name"
                  placeholder="E.g., Gadgets Express"
                  className="pl-10 h-11 rounded-xl bg-muted/20"
                  {...register("full_name")}
                />
              </div>
              {errors.full_name && (
                <p className="text-destructive text-xs">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="student_id"
                className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
              >
                Student ID Reference *
              </Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input
                  id="student_id"
                  placeholder="UCC/CS/2021/0001"
                  className={`pl-10 h-11 rounded-xl bg-muted/20 ${errors.student_id ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  {...register("student_id")}
                />
              </div>
              {errors.student_id && (
                <p className="text-destructive text-xs font-semibold mt-1">
                  {errors.student_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
              >
                Business Hotline Contact *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input
                  id="phone"
                  placeholder="024XXXXXXX"
                  className="pl-10 h-11 rounded-xl bg-muted/20"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-destructive text-xs">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="location"
                className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
              >
                Operational Hub Location *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input
                  id="location"
                  placeholder="Science Market / Near Cal Bank"
                  className="pl-10 h-11 rounded-xl bg-muted/20"
                  {...register("location")}
                />
              </div>
              {errors.location && (
                <p className="text-destructive text-xs">
                  {errors.location.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="bio"
              className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
            >
              Service Scope Description / Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Describe your services, skills, or operational terms..."
              className="rounded-xl bg-muted/20 resize-none"
              rows={3}
              {...register("bio")}
            />
          </div>
        </div>

        {/* Service Availability Settings */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground font-heading text-lg">
                Service Availability
              </h2>
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Select the active days and standard hours you are open to receive
            bookings on campus.
          </p>

          <Controller
            name="available_days"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isChecked = field.value?.includes(day);
                  return (
                    <label
                      key={day}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none hover:bg-muted/30 ${
                        isChecked
                          ? "border-primary bg-primary/5 font-semibold text-primary"
                          : "border-border/60 bg-muted/10 text-muted-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const updated = checked
                            ? [...(field.value || []), day]
                            : (field.value || []).filter((d) => d !== day);
                          field.onChange(updated);
                        }}
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.available_days && (
            <p className="text-destructive text-xs mt-1">
              {errors.available_days.message}
            </p>
          )}

          <div className="space-y-2 pt-2">
            <Label
              htmlFor="available_time"
              className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Standard
              Daily Operating Hours *
            </Label>
            <Input
              id="available_time"
              placeholder="E.g., 8:00 AM - 5:00 PM, or Free during afternoon periods"
              className="h-11 rounded-xl bg-muted/20"
              {...register("available_time")}
            />
            <p className="text-[11px] text-muted-foreground">
              Let clients know your general availability window so they can
              coordinate specific session times appropriately.
            </p>
            {errors.available_time && (
              <p className="text-destructive text-xs">
                {errors.available_time.message}
              </p>
            )}
          </div>
        </div>

        {/* Mobile Money Payout Details */}
        <div className="bg-card rounded-2xl border border-amber-500/20 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-foreground font-heading text-lg">
              Mobile Money Payout details
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="momo_network"
                className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
              >
                Network Platform *
              </Label>
              <select
                id="momo_network"
                className="w-full h-11 px-3 rounded-xl bg-muted/20 border border-input focus:ring-2 focus:ring-primary outline-none font-medium text-sm"
                {...register("momo_network")}
              >
                <option value="MTN">MTN Mobile Money</option>
                <option value="Telecel">Telecel Cash</option>
                <option value="AirtelTigo">AT Money</option>
              </select>
              {errors.momo_network && (
                <p className="text-destructive text-xs">
                  {errors.momo_network.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="momo_number"
                className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
              >
                Mobile Money Number *
              </Label>
              <Input
                id="momo_number"
                placeholder="054XXXXXXX"
                className="h-11 rounded-xl bg-muted/20"
                {...register("momo_number")}
              />
              {errors.momo_number && (
                <p className="text-destructive text-xs">
                  {errors.momo_number.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="momo_name"
                className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
              >
                Account Registered Name *
              </Label>
              <Input
                id="momo_name"
                placeholder="E.g., Sadiq Abubakar"
                className="h-11 rounded-xl bg-muted/20"
                {...register("momo_name")}
              />
              {errors.momo_name && (
                <p className="text-destructive text-xs">
                  {errors.momo_name.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl font-heading font-semibold shadow-amber-500/10"
          disabled={isLoading || uploading || !isDirty}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Committing
              Business Profiles...
            </>
          ) : (
            "Update Provider Profile"
          )}
        </Button>
      </form>
    </div>
  );
}
