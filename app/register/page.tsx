import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Shield, Users, TrendingUp, Star } from "lucide-react";
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
    <div className="h-screen w-screen grid lg:grid-cols-2 bg-background overflow-hidden">
      {/* LEFT PANEL - Marketing Hero Panel */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-center p-10 xl:p-14 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="flex flex-col gap-8 xl:gap-10 relative z-10 w-full max-w-md xl:max-w-xl mx-auto">
          {/* Logo element */}
          <Link href="/" className="flex items-center gap-3 group self-start">
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

          {/* Marketing Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-heading leading-tight">
                Build. Learn.{" "}
                <span className="block text-white/90">Earn on campus.</span>
              </h1>
              <p className="text-white/80 text-base xl:text-lg">
                A single profile marketplace for UCC students to share skills,
                offer services, or secure peer help.
              </p>
            </div>

            {/* Feature Grid */}
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
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form Container */}
      <div className="flex items-center justify-center p-6 lg:p-12 overflow-y-auto h-full">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="h-96 animate-pulse bg-muted/30 rounded-xl" />}>
            <RegistrationForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
