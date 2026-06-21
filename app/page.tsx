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
import { AnimatedSection } from "@/components/landing/animated-section";

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

      {/* Hero animates immediately on load rather than on scroll,
          since it's visible above the fold from the start. */}
      <AnimatedSection amount={0.01}>
        <HeroSection onGetStarted={handleGetStarted} />
      </AnimatedSection>

      <AnimatedSection>
        <FeaturesSection />
      </AnimatedSection>

      <AnimatedSection>
        <ServiceGridSection />
      </AnimatedSection>

      <AnimatedSection>
        <TestimonialsSection />
      </AnimatedSection>

      <AnimatedSection>
        <StepsSection onGetStarted={handleGetStarted} />
      </AnimatedSection>

      <AnimatedSection>
        <CTASection onGetStarted={handleGetStarted} />
      </AnimatedSection>

      <Footer />
    </div>
  );
}
