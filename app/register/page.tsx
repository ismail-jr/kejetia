"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
} from "lucide-react";

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
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
  });

  const role = watch("role");

  const selectRole = (r: "student" | "provider") => {
    setValue("role", r);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: data.full_name,
          email: data.email,
          student_id: data.student_id,
          role: data.role,
        });
      }

      toast.success("Account created successfully!");
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* LEFT PANEL - Modern Hero Section */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80 text-white">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="relative w-12 h-12">
            <Image
              src="/images/logo.png"
              alt="UCC Connect Logo"
              fill
              className="object-contain rounded-xl bg-white/10 backdrop-blur-sm p-2 group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight">
              UCC Connect
            </span>
            <p className="text-xs text-white/70">Campus Marketplace</p>
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
              A marketplace for students to share skills and get help from
              peers.
            </p>
          </div>

          {/* Benefits Grid */}
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

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">Free to join</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">Verified community</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">Secure platform</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/60 text-sm">
          © {year} UCC Connect · University of Cape Coast
        </p>
      </div>

      {/* RIGHT PANEL - Registration Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <Image
                  src="/images/logo.png"
                  alt="UCC Connect Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-lg">UCC Connect</span>
                <p className="text-xs text-muted-foreground">
                  Campus Marketplace
                </p>
              </div>
            </Link>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Create account
            </h1>
            <p className="text-muted-foreground">
              Join the UCC student marketplace
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: "student",
                label: "Student",
                icon: BookOpen,
                description: "Browse & discover services",
              },
              {
                id: "provider",
                label: "Provider",
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

          {/* Form */}
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
                  className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/20"
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/20"
                  placeholder="student@stu.ucc.edu.gh"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Use your official UCC email address
              </p>
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <Label htmlFor="student_id" className="text-sm font-medium">
                Student ID
              </Label>
              <Input
                id="student_id"
                className="h-11 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/20"
                placeholder="UCC123456789"
                {...register("student_id")}
              />
              {errors.student_id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span>⚠</span> {errors.student_id.message}
                </p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
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

          {/* Login Link */}
          <p className="text-center text-sm">
            <Link
              href="/login"
              className="text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              Sign in to your account
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>

          {/* Campus Benefits */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Why Join?
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>✓ Exclusively for UCC students</span>
              <span>✓ Free to join</span>
              <span>✓ Verified community</span>
              <span>✓ Secure messaging</span>
              <span>✓ Build your portfolio</span>
              <span>✓ Earn while learning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
