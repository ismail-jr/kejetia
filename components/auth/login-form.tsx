"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
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
    <div className="w-full max-w-md space-y-4">
      {/* Mobile Header Logo */}
      <div className="w-full lg:hidden mb-4">
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

      <div className="space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-xs">
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
          <Label htmlFor="email" className="text-xs font-heading font-bold">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-9 h-9 mt-2 text-sm rounded-lg"
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

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-heading font-bold">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="pl-9 pr-8 mt-2 h-9 text-sm rounded-lg"
              placeholder="Enter your password"
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
          {errors.password && (
            <p className="text-[11px] text-destructive mt-0.5">
              ⚠ {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-9 text-sm rounded-lg bg-gradient-to-r from-primary to-primary/90 font-medium mt-1"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </Button>
      </form>

      <div className="relative pt-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-[11px]">
          <span className="px-2 bg-background text-muted-foreground">
            New to Kejetia?
          </span>
        </div>
      </div>

      <p className="text-center text-xs">
        <Link
          href="/register"
          className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
        >
          Create an account <ArrowRight className="w-3 h-3" />
        </Link>
      </p>
    </div>
  );
}
