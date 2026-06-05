"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  BookOpen,
  Briefcase,
  Shield,
  CheckCircle,
  Sparkles,
  Users,
  Star,
  TrendingUp,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const schema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .email("Please enter a valid email")
      .refine(
        (e) => e.endsWith("@stu.ucc.edu.gh") || e.endsWith("@ucc.edu.gh"),
        "Use your official UCC email address",
      ),
    student_id: z.string().min(4, "Student ID is required"),
    role: z.enum(["student", "provider"]),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

const benefits = [
  {
    icon: Shield,
    title: "UCC Verified Only",
    description: "Exclusive access for UCC students",
  },
  {
    icon: Users,
    title: "Peer-to-Peer",
    description: "Connect with fellow students",
  },
  {
    icon: TrendingUp,
    title: "Build Your Brand",
    description: "Offer services and grow",
  },
  {
    icon: Star,
    title: "Trusted Reviews",
    description: "Verified feedback system",
  },
];

export default function RegisterPage() {
  const { registerUser, isAuthLoading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Determine if a student is adding an additional profile role to their authenticated session
  const isAddingSecondaryRole = !!user;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "student",
      // Pre-fill user metadata fields securely if session state layer is hydrated
      email: user?.email || "",
      full_name: user?.user_metadata?.full_name || "",
      student_id: user?.user_metadata?.student_id || "",
    },
  });

  const role = watch("role");

  const selectRole = (r: "student" | "provider") => {
    setValue("role", r);
  };

  const onSubmit = async (data: FormData) => {
    await registerUser({
      email: data.email,
      password: data.password,
      fullName: data.full_name,
      studentId: data.student_id,
      role: data.role,
    });
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* LEFT PANEL - Modern Hero Section */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="relative w-12 h-12">
            <Image
              src="/images/logo.png"
              alt="UCC Connect Logo"
              fill
              sizes="(max-w-768px) 100vw, 33vw"
              className="object-contain rounded-xl bg-white backdrop-blur-sm p-2 group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight">
              UCC Connect
            </span>
          </div>
        </Link>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Build. Learn.
              <span className="block text-white/90">Earn on campus.</span>
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              A single profile marketplace for UCC students to share skills,
              offer services, or secure peer help.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <Icon className="w-5 h-5 mb-2 text-white/80" />
                  <p className="font-medium text-sm">{benefit.title}</p>
                  <p className="text-xs text-white/60 mt-1">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">
                One single email identity
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">
                Dual-role flexibility
              </span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-white/60 text-sm">
          © {year} UCC Connect · University of Cape Coast
        </p>
      </div>

      {/* RIGHT PANEL - Registration Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <Image
                  src="/images/logo.png"
                  alt="UCC Connect Logo"
                  fill
                  sizes="(max-w-768px) 100vw, 33vw"
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-lg">UCC Connect</span>
              </div>
            </Link>
          </div>

          {/* Dynamic Header Titles based on Authentication Status */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {isAddingSecondaryRole
                ? "Unlock secondary role"
                : "Create account"}
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
                onClick={() => selectRole(id as any)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  role === id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-2 ${
                    role === id ? "text-primary" : "text-muted-foreground"
                  }`}
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
                  className="pl-10 h-11 rounded-xl disabled:opacity-75 disabled:bg-muted"
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

            {/* Password Configuration Layout */}
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
                    className="pl-10 pr-10 h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/20"
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
                <Label
                  htmlFor="confirm_password"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-10 pr-10 h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/20"
                    placeholder="********"
                    {...register("confirm_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span>⚠</span> {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isAuthLoading}
            >
              {isAuthLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing request...
                </div>
              ) : isAddingSecondaryRole ? (
                <>
                  Activate {role === "provider" ? "Provider" : "Student"} View
                  <PlusCircle className="ml-2 w-4 h-4" />
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {!isAddingSecondaryRole && (
            <>
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
                  Sign in to your account
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
