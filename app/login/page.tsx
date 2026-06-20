"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
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
  Loader2, // Imported the spinner loader
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
  const { signIn, signOut } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const email = data.email.toLowerCase();

    const isUccEmail =
      email.endsWith("@stu.ucc.edu.gh") || email.endsWith("@ucc.edu.gh");

    try {
      const result = await signIn(data.email, data.password);

      if (!result) {
        toast.error("Login failed");
        setLoading(false);
        return;
      }

      const roles = result.roles || [];
      const activeRole = result.activeRole;
      const isAdmin =
        result.isAdmin || roles.includes("admin") || activeRole === "admin";

      if (!roles.length) {
        await signOut();
        setLoading(false);
        return;
      }

      const multipleRoles = roles.length > 1;

      if (!isUccEmail && !isAdmin) {
        setError("email", {
          type: "manual",
          message: "Use UCC email or admin account",
        });

        await signOut();
        return;
      }

      toast.success("Login successful");

      let path = "/login";

      if (isAdmin) {
        path = "/admin/dashboard";
      } else if (multipleRoles) {
        path = "/role-selection";
      } else if (activeRole) {
        path = `/${activeRole}/dashboard`;
      } else if (roles.length > 0) {
        path = `/${roles[0]}/dashboard`;
      }

      router.replace(path);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="relative w-12 h-12">
            <Image
              src="/images/logo.png"
              alt="Kejetia Logo"
              fill
              sizes="(max-w-768px) 100vw, 33vw"
              className="object-contain rounded-xl bg-white backdrop-blur-sm p-2 group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight">Kejetia</span>
          </div>
        </Link>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Your campus marketplace{" "}
              <span className="block text-white/90">awaits you.</span>
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Connect with students, offer services, and grow together at UCC.
            </p>
          </div>

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

        <p className="relative z-10 text-white/60 text-sm">
          © 2026 Kejetia · University of Cape Coast
        </p>
      </div>

      {/* RIGHT PANEL - Form UI */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to continue to your dashboard
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10 h-12 rounded-xl"
                  placeholder="student@stu.ucc.edu.gh"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1">
                  ⚠ {errors.email.message}
                </p>
              )}
            </div>

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
                  className="pl-10 pr-10 h-12 rounded-xl"
                  placeholder="Enter your password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">
                  ⚠ {errors.password.message}
                </p>
              )}
            </div>

            {/* Accessible and context-safe loading submit state layout */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted-foreground">
                New to Kejetia?
              </span>
            </div>
          </div>

          <p className="text-center text-sm">
            <Link
              href="/register"
              className="text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              Create an account <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
