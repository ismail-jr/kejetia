"use client";

import { useState } from "react";
import Link from "next/link";
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
  ArrowRight,
  Shield,
  Users,
  Briefcase,
  MessageSquare,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

const schema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .refine(
      (e) => e.endsWith("@stu.ucc.edu.gh") || e.endsWith("@ucc.edu.gh"),
      "Please use your UCC student email",
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const features = [
  {
    icon: Users,
    title: "Active Students",
    value: "500+",
    description: "Growing community daily",
  },
  {
    icon: Briefcase,
    title: "Services Listed",
    value: "120+",
    description: "From tutoring to design",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    value: "Live",
    description: "Connect instantly",
  },
  {
    icon: Shield,
    title: "UCC Verified",
    value: "100%",
    description: "Campus-only access",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        const role = profile?.role || "student";

        toast.success("Welcome back!");
        router.push(`/${role}/dashboard`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* LEFT PANEL - Modern Design */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse delay-1000" />
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
              Your campus marketplace
              <span className="block text-white/90">awaits you.</span>
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Connect with students, offer services, and grow together at UCC.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-white/80" />
                    <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
                      {feature.title}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">{feature.value}</div>
                  <p className="text-xs text-white/60 mt-1">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">UCC email required</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">Verified users only</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/60 text-sm">
          © {year} UCC Connect · University of Cape Coast
        </p>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10 h-12 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/20"
                  placeholder="student@stu.ucc.edu.gh"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <span className="text-destructive">⚠</span>{" "}
                  {errors.email.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Use your official UCC email address
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10 h-12 rounded-xl border-border/60 focus:border-primary/50 focus:ring-primary/20"
                  placeholder="Enter your password"
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
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <>
                  Sign In
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
                New to UCC Connect?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm">
            <Link
              href="/register"
              className="text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              Create an account
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>

          {/* Campus Benefits */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Campus Benefits
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>✓ Exclusively for UCC students</span>
              <span>✓ Verified community</span>
              <span>✓ Free to join</span>
              <span>✓ Secure messaging</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
