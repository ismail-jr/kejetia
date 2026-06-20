"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/auth/loading-button";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  BookOpen,
  Briefcase,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const schema = z
  .object({
    full_name: z
      .string()
      .or(z.string().min(2, "Full name must be at least 2 characters")),
    email: z
      .string()
      .email("Please enter a valid email")
      .refine(
        (e) => e.endsWith("@stu.ucc.edu.gh") || e.endsWith("@ucc.edu.gh"),
        "Use your official UCC email address",
      ),
    student_id: z.string().or(z.string().min(4, "Student ID is required")),
    role: z.enum(["student", "provider"]),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export function RegistrationForm() {
  const { registerUser, isAuthLoading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isAddingSecondaryRole = !!user;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      role: (user ? "provider" : "student") as "student" | "provider",
      email: user?.email || "",
      full_name: (user?.user_metadata?.full_name as string) || "",
      student_id: (user?.user_metadata?.student_id as string) || "",
      password: "",
      confirm_password: "",
    },
  });

  const role = watch("role");

  const selectRole = (r: "student" | "provider") => {
    setValue("role", r);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName:
          data.full_name || (user?.user_metadata?.full_name as string) || "",
        studentId:
          data.student_id || (user?.user_metadata?.student_id as string) || "",
        role: data.role,
      });
    } catch (error: any) {
      console.error("Registration processing error caught:", error);

      const errorMessage = error.message?.toLowerCase() || "";
      const isConflict =
        error.status === 409 ||
        error.statusCode === 409 ||
        errorMessage.includes("already registered") ||
        errorMessage.includes("conflict") ||
        errorMessage.includes("already exists");

      if (isConflict) {
        const friendlyMessage = `This email is already registered as a ${data.role}.`;

        setError("email", {
          type: "manual",
          message: friendlyMessage,
        });

        toast.error("Account Creation Failed", {
          description: `An account with this email already exists under the ${data.role} profile layer. Please sign in instead.`,
          duration: 6000,
        });
      } else {
        toast.error(
          error.message || "An unexpected error occurred during signup.",
        );
      }
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {isAddingSecondaryRole ? "Unlock secondary role" : "Create account"}
        </h1>
        <p className="text-muted-foreground">
          {isAddingSecondaryRole
            ? "Add a new operating profile layer using your current student identity"
            : "Join the dual-role UCC student marketplace"}
        </p>
      </div>

      {/* Role Selection Blocks */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            id: "student",
            label: "Student (Receiver)",
            icon: BookOpen,
            description: "Browse & discover services",
          },
          {
            id: "provider",
            label: "Provider (Seller)",
            icon: Briefcase,
            description: "Offer your skills",
          },
        ].map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            type="button"
            disabled={isAddingSecondaryRole && role === id}
            onClick={() => selectRole(id as any)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              role === id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30"
            } ${isAddingSecondaryRole && role !== id ? "animate-pulse border-dashed border-orange-400" : ""}`}
          >
            <Icon
              className={`w-5 h-5 mb-2 ${role === id ? "text-primary" : "text-muted-foreground"}`}
            />
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-sm font-medium">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="full_name"
              disabled={isAddingSecondaryRole}
              className="pl-10 h-11 rounded-xl disabled:opacity-75 disabled:bg-muted"
              placeholder="Kwame Nkrumah"
              {...register("full_name")}
            />
          </div>
          {errors.full_name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              disabled={isAddingSecondaryRole}
              className={`pl-10 h-11 rounded-xl disabled:opacity-75 disabled:bg-muted ${
                errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
              placeholder="student@stu.ucc.edu.gh"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.email.message}
            </p>
          )}
        </div>

        {/* Student ID */}
        <div className="space-y-2">
          <Label htmlFor="student_id" className="text-sm font-medium">
            Student ID
          </Label>
          <Input
            id="student_id"
            disabled={isAddingSecondaryRole}
            className="h-11 rounded-xl disabled:opacity-75 disabled:bg-muted"
            placeholder="PS/ITC/22/12345"
            {...register("student_id")}
          />
          {errors.student_id && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.student_id.message}
            </p>
          )}
        </div>

        {/* Passwords layout split */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              {isAddingSecondaryRole ? "Account Password" : "Password"}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-10 h-11 rounded-xl"
                placeholder="********"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span>⚠</span> {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                className="pl-10 pr-10 h-11 rounded-xl"
                placeholder="********"
                {...register("confirm_password")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span>⚠</span> {errors.confirm_password.message}
              </p>
            )}
          </div>
        </div>

        <LoadingButton
          type="submit"
          isLoading={isAuthLoading}
          loadingText="Processing request..."
          className="bg-gradient-to-r from-primary to-primary/90 mt-2"
          icon={
            isAddingSecondaryRole ? (
              <PlusCircle className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )
          }
        >
          {isAddingSecondaryRole
            ? `Activate ${role === "provider" ? "Provider" : "Student"} View`
            : "Create Account"}
        </LoadingButton>
      </form>

      {!isAddingSecondaryRole && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>
          <p className="text-center text-sm">
            <Link
              href="/login"
              className="text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              Sign in to your account <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
