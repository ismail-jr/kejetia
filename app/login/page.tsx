import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Spinner } from "@/components/shared/spinner";
import {
  Shield,
  Users,
  Briefcase,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

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
  return (
    <div className="h-screen w-screen grid lg:grid-cols-2 bg-background overflow-hidden">
      {/* LEFT PANEL (Desktop View) */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-center p-10 xl:p-14 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Unified container to prevent layout gaps */}
        <div className="flex flex-col gap-8 xl:gap-10 relative z-10 w-full max-w-md xl:max-w-xl mx-auto">
          {/* LOGO FOR DESKTOP SCREENS */}
          <Link href="/" className="flex items-center gap-3 group self-start">
            <Logo
              size={48}
              className="rounded-xl bg-white backdrop-blur-sm p-2 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-bold text-xl tracking-tight">Kejetia</span>
            </div>
          </Link>

          {/* Features Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-heading leading-tight">
                Your campus marketplace{" "}
                <span className="block text-white/90">awaits you.</span>
              </h1>
              <p className="text-white/80 text-base xl:text-lg">
                Connect with students, offer services, and grow together at UCC.
              </p>
            </div>

            {/* Feature Statistics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-white/80" />
                      <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">
                        {feature.title}
                      </span>
                    </div>
                    <div className="text-xl font-bold leading-tight">
                      {feature.value}
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Check Badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white/80" />
                <span className="text-xs text-white/80">
                  UCC email required
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-white/80" />
                <span className="text-xs text-white/80">
                  Verified users only
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL (Form Layout Container) */}
      <div className="flex items-center justify-center p-6 lg:p-12 overflow-y-auto h-full">
        <Suspense
          fallback={
            <Spinner />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
