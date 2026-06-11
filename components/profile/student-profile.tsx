"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Phone,
  BookOpen,
  MapPin,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const studentSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  student_id: z.string().min(1, "Student ID is required for validation"),
  phone: z.string().min(9, "Enter a valid phone number"),
  location: z.string().min(2, "Please state your residential hostel or area"),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  avatar_url: z.string().optional().or(z.literal("")),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentProfileProps {
  initialData: any;
  onSave: (data: any) => Promise<void>;
  loading: boolean;
}

export default function StudentProfile({
  initialData,
  onSave,
  loading: externalLoading,
}: StudentProfileProps) {
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      student_id: initialData?.student_id || "",
      phone: initialData?.phone || "",
      location: initialData?.location || "",
      bio: initialData?.bio || "",
      avatar_url: initialData?.avatar_url || "",
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
      });
    }
  }, [initialData, reset]);

  const currentAvatarUrl = watch("avatar_url");

  const handleFormSubmit = async (formData: StudentFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(formData);
      setIsSubmitting(false);
    } catch (error: any) {
      console.error("Intercepted profile save exception details:", error);

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
      const filePath = `student-${uniqueId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setValue("avatar_url", publicUrl, { shouldDirty: true });

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
        if (initialData) initialData.avatar_url = publicUrl;
      }

      toast.success("Profile picture updated and saved permanently!");
    } catch (error: any) {
      console.error("Avatar runtime sync failure:", error);
      toast.error(error.message || "Failed to host file configuration.");
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
      .slice(0, 2) || "ST";
  const isLoading = externalLoading || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6 bg-card rounded-2xl border border-border/50 p-6 shadow-sm"
    >
      <h2 className="font-bold text-foreground font-heading text-lg">
        Student Portal Information
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-muted/20 border border-border/40">
        <Avatar className="w-20 h-20 border border-border">
          <AvatarImage
            src={currentAvatarUrl}
            alt="Avatar preview"
            className="object-cover"
          />
          <AvatarFallback className="bg-muted text-transparent rounded-full animate-pulse">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5 flex-1 w-full text-center sm:text-left">
          <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block">
            Profile Image
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
            Upload Profile
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Supports JPEG, PNG up to 2MB capacity limit thresholds.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="full_name"
            className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
          >
            Full Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              id="full_name"
              placeholder="John Doe"
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
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
          >
            Phone Number *
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              id="phone"
              placeholder="054XXXXXXX"
              className="pl-10 h-11 rounded-xl bg-muted/20"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-destructive text-xs">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="location"
            className="font-semibold text-xs text-muted-foreground uppercase tracking-wider"
          >
            Campus Location / Hostel *
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              id="location"
              placeholder="Valco Hall / Science Market"
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
          Student Bio
        </Label>
        <Textarea
          id="bio"
          placeholder="Tell students about your academic focus or campus interests..."
          className="rounded-xl bg-muted/20 resize-none"
          rows={4}
          {...register("bio")}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-xl font-heading font-semibold"
        disabled={isLoading || uploading || !isDirty}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Student
            Profile...
          </>
        ) : (
          "Update Student Profile"
        )}
      </Button>
    </form>
  );
}
