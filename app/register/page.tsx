import Link from "next/link";
import Image from "next/image";
import { Shield, Users, TrendingUp, Star, CheckCircle } from "lucide-react";
import { RegistrationForm } from "@/components/auth/registration-form";

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
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* LEFT PANEL - Marketing Hero Panel */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

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
            <span className="font-bold text-xl tracking-tight">Kejetia</span>
          </div>
        </Link>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Build. Learn.{" "}
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
          © 2026 Kejetia · University of Cape Coast
        </p>
      </div>

      {/* RIGHT PANEL - Container mounting the Client Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <RegistrationForm />
      </div>
    </div>
  );
}
