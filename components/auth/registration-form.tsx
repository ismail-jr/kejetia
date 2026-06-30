"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  HelpCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthApiError } from "@/lib/api/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// When an already signed-in user is unlocking a second role we don't
// collect a password (the account already exists and is verified), so
// password validation is skipped in that mode. Field types stay stable
// (always `string`); only the validation rules differ via superRefine.
const makeSchema = (requirePassword: boolean) =>
  z
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
      password: z.string(),
      confirm_password: z.string(),
    })
    .superRefine((d, ctx) => {
      if (!requirePassword) return;
      if (d.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password must be at least 8 characters",
        });
      }
      if (d.password !== d.confirm_password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirm_password"],
          message: "Passwords do not match",
        });
      }
    });

type FormData = z.infer<ReturnType<typeof makeSchema>>;

// ── Password strength helpers ────────────────────────────────────────────────
function getStrength(password: string): {
  score: number; // 0–4
  label: string;
  color: string; // Tailwind text colour
  barColor: string; // Tailwind bg colour
} {
  if (!password) return { score: 0, label: "", color: "", barColor: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Cap at 4 levels
  const capped = Math.min(score, 4);

  const map: Record<
    number,
    { label: string; color: string; barColor: string }
  > = {
    1: { label: "Weak", color: "text-red-500", barColor: "bg-red-500" },
    2: { label: "Fair", color: "text-orange-400", barColor: "bg-orange-400" },
    3: { label: "Good", color: "text-yellow-500", barColor: "bg-yellow-500" },
    4: { label: "Strong", color: "text-green-500", barColor: "bg-green-500" },
  };

  return {
    score: capped,
    ...(map[capped] ?? { label: "", color: "", barColor: "" }),
  };
}

export function RegistrationForm() {
  const { registerUser, addRole, addRoleWithCredentials, isAuthLoading, user, profile, roles } =
    useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get("role");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isAddingSecondaryRole = !!user;

  // When signed in, default to the role they don't have yet.
  const defaultRole = (() => {
    if (
      roleFromUrl === "provider" ||
      roleFromUrl === "student"
    ) {
      return roleFromUrl;
    }
    if (user && roles.length > 0) {
      if (!roles.includes("provider")) return "provider" as const;
      if (!roles.includes("student")) return "student" as const;
    }
    return "student" as const;
  })();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(makeSchema(!isAddingSecondaryRole)),
    values: {
      role: defaultRole,
      email: user?.email || profile?.email || "",
      full_name: profile?.full_name || "",
      student_id: profile?.student_id || "",
      password: "",
      confirm_password: "",
    },
  });

  const role = watch("role");
  const passwordValue = watch("password") ?? "";
  const confirmValue = watch("confirm_password") ?? "";

  const strength = getStrength(passwordValue);
  const passwordsMatch =
    passwordValue.length > 0 &&
    confirmValue.length > 0 &&
    passwordValue === confirmValue;
  const passwordsMismatch =
    confirmValue.length > 0 && passwordValue !== confirmValue;

  const selectRole = (r: "student" | "provider") => setValue("role", r);

  const onSubmit = async (data: FormData) => {
    try {
      // Signed-in user unlocking a second role (no password / OTP).
      if (isAddingSecondaryRole) {
        if (roles.includes(data.role)) {
          toast.error(`You already have the ${data.role} role.`);
          router.push(`/${data.role}/dashboard`);
          return;
        }
        const result = await addRole(data.role);
        router.push(`/${result.activeRole}/dashboard`);
        return;
      }

      // Brand-new registration (OTP flow).
      try {
        await registerUser({
          email: data.email,
          password: data.password,
          fullName: data.full_name || "",
          studentId: data.student_id || "",
          role: data.role,
        });
      } catch (initErr) {
        // Same email already registered as student — unlock provider (or
        // vice versa) with the password they just entered. No OTP needed.
        if (
          initErr instanceof AuthApiError &&
          initErr.code === "ADD_ROLE_WITH_PASSWORD"
        ) {
          const result = await addRoleWithCredentials(
            data.email,
            data.password,
            data.role,
          );
          router.push(`/${result.activeRole}/dashboard`);
          return;
        }
        throw initErr;
      }
    } catch (error: any) {
      console.error("Registration processing error caught:", error);

      const errorMessage = error.message?.toLowerCase() || "";

      const isRateLimited =
        error.status === 429 ||
        error.statusCode === 429 ||
        errorMessage.includes("wait before retry") ||
        errorMessage.includes("too many requests");

      if (isRateLimited) {
        toast.error("Slow down a moment", {
          description:
            "You're making requests too quickly. Please wait a minute before trying again.",
          duration: 5000,
        });
        return;
      }

      const isConflict =
        error.status === 409 ||
        error.statusCode === 409 ||
        errorMessage.includes("already registered") ||
        errorMessage.includes("conflict") ||
        errorMessage.includes("already exists");

      if (isConflict) {
        const alreadyHasRole =
          error instanceof AuthApiError &&
          error.code === "ROLE_ALREADY_EXISTS";
        if (alreadyHasRole) {
          toast.info("You already have this role. Redirecting to sign in.");
          router.push(`/login?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setError("email", {
          type: "manual",
          message: `This email is already registered as a ${data.role}.`,
        });
        toast.error("Account already exists", {
          description:
            "Use the same password on this form to unlock your other role, or sign in.",
          duration: 6000,
        });
      } else {
        toast.error(
          error.message ||
            "An unexpected error occurred during signup. Please try again.",
        );
      }
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Mobile logo */}
      <div className="w-full max-w-md lg:hidden mb-4 self-start">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Image
              src="/images/logo.png"
              alt="Kejetia Logo"
              fill
              sizes="32px"
              className="object-contain rounded-lg bg-white p-1 group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="text-left">
            <span className="font-bold text-sm tracking-tight text-foreground block leading-none mb-0.5">
              Kejetia
            </span>
          </div>
        </Link>
      </div>

      {/* Heading */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight">
          {isAddingSecondaryRole ? "Unlock secondary role" : "Create account"}
        </h1>
        <p className="text-muted-foreground text-xs">
          {isAddingSecondaryRole
            ? "Add a provider or student profile to your existing UCC account"
            : "Join the dual-role UCC student marketplace — one email, two workspaces"}
        </p>
      </div>

      {/* Role selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Choose your role
          </span>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="What's the difference between Student and Provider?"
                  className="relative flex items-center justify-center w-3.5 h-3.5 rounded-full text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary/30 animate-ping" />
                  <HelpCircle className="relative w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="w-64">
                <p className="mb-1.5 text-xs">
                  <span className="font-semibold">Student</span> — browse and
                  book services.
                </p>
                <p className="text-xs">
                  <span className="font-semibold">Provider</span> — list your
                  own skills or services.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              id: "student",
              label: "Student",
              icon: BookOpen,
              description: "Browse & hire help",
            },
            {
              id: "provider",
              label: "Provider",
              icon: Briefcase,
              description: "Offer skills & earn",
            },
          ].map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              type="button"
              disabled={isAddingSecondaryRole && role === id}
              onClick={() => selectRole(id as any)}
              className={`p-2.5 rounded-lg border-2 transition-all text-left flex items-center gap-2.5 w-full ${
                role === id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/20"
              } ${isAddingSecondaryRole && role !== id ? "animate-pulse border-orange-400" : ""}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${role === id ? "text-primary" : "text-muted-foreground"}`}
              />
              <div className="leading-tight">
                <p className="font-bold text-xs text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Name */}
        <div className="space-y-1">
          <Label htmlFor="full_name" className="text-xs font-heading font-bold">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="full_name"
              disabled={isAddingSecondaryRole}
              className="pl-9 h-9 mt-2 text-sm rounded-lg disabled:opacity-75 disabled:bg-muted"
              placeholder="Kwame Nkrumah"
              {...register("full_name")}
            />
          </div>
          {errors.full_name && (
            <p className="text-[11px] text-destructive mt-0.5">
              ⚠ {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-heading font-bold">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              disabled={isAddingSecondaryRole}
              className={`pl-9 h-9 mt-2 text-sm rounded-lg disabled:opacity-75 disabled:bg-muted ${
                errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }`}
              placeholder="student@stu.ucc.edu.gh"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-destructive mt-0.5">
              ⚠ {errors.email.message}
            </p>
          )}
        </div>

        {/* Student ID */}
        <div className="space-y-1">
          <Label
            htmlFor="student_id"
            className="text-xs font-heading font-bold"
          >
            Student ID
          </Label>
          <Input
            id="student_id"
            disabled={isAddingSecondaryRole}
            className="h-9 mt-2 text-sm rounded-lg disabled:opacity-75 disabled:bg-muted"
            placeholder="PS/ITC/22/12345"
            {...register("student_id")}
          />
          {errors.student_id && (
            <p className="text-[11px] text-destructive mt-0.5">
              ⚠ {errors.student_id.message}
            </p>
          )}
        </div>

        {/* Passwords — only needed when creating a brand-new account */}
        {!isAddingSecondaryRole && (
        <div className="grid grid-cols-2 gap-2.5">
          {/* Password */}
          <div className="space-y-1">
            <Label
              htmlFor="password"
              className="text-xs font-heading font-bold"
            >
              {isAddingSecondaryRole ? "Account Password" : "Password"}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-9 pr-8 h-9 mt-2 text-sm rounded-lg"
                placeholder="••••••••"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Strength meter — only shown when typing */}
            {passwordValue.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.barColor : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className={`text-[10px] font-medium ${strength.color}`}>
                    {strength.label} password
                  </p>
                )}
              </div>
            )}

            {errors.password && (
              <p className="text-[11px] text-destructive mt-0.5">
                ⚠ {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label
              htmlFor="confirm_password"
              className="text-xs font-heading font-bold"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                className={`pl-9 pr-8 mt-2 h-9 text-sm rounded-lg transition-colors ${
                  passwordsMatch
                    ? "border-green-500 focus-visible:ring-green-500"
                    : passwordsMismatch
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                }`}
                placeholder="••••••••"
                {...register("confirm_password")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Match / mismatch feedback */}
            {passwordsMatch && (
              <p className="text-[10px] text-green-500 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Passwords match
              </p>
            )}
            {passwordsMismatch && !errors.confirm_password && (
              <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5">
                <XCircle className="w-3 h-3" /> Passwords do not match
              </p>
            )}
            {errors.confirm_password && (
              <p className="text-[11px] text-destructive mt-0.5">
                ⚠ {errors.confirm_password.message}
              </p>
            )}
          </div>
        </div>
        )}

        {/* Submit */}
        <LoadingButton
          type="submit"
          isLoading={isAuthLoading}
          loadingText="Processing..."
          className="bg-gradient-to-r from-primary to-primary/90 mt-1 h-9 rounded-lg text-sm w-full"
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

      {/* Sign-in footer */}
      {!isAddingSecondaryRole && (
        <div className="space-y-2 pt-1">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="px-2 bg-background text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>
          <p className="text-center text-xs">
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              Sign in to your account <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
