"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { TestimonialsSection } from "@/components/landing/testimonial-section";
import { StepsSection } from "@/components/landing/steps-section";
import { CTASection } from "@/components/landing/cta-section";
import { ServiceGridSection } from "@/components/landing/service-section";

export default function LandingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user && profile) {
      router.push(`/${profile.active_role}/dashboard`);
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection onGetStarted={handleGetStarted} />
      <FeaturesSection />
      <ServiceGridSection />

      <TestimonialsSection />
      <StepsSection onGetStarted={handleGetStarted} />
      <CTASection onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
}
