"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Lock,
  Zap,
  Users,
  BookOpen,
  WashingMachine,
  Laptop,
  Bike,
  Camera,
  Wrench,
  Dumbbell,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface HeroSectionProps {
  onGetStarted: () => void;
}

interface PopularService {
  id: string;
  title: string;
  category: string;
  price: string;
  images: string[];
}

const CATEGORY_ICONS: Record<string, any> = {
  "design & creative": Camera,
  design: Camera,
  programming: Laptop,
  tutoring: BookOpen,
  photography: Camera,
  writing: BookOpen,
  music: Users,
  fitness: Dumbbell,
  cooking: Wrench,
  laundry: WashingMachine,
  errands: Bike,
};

const CATEGORY_ICON_ROW = [
  BookOpen,
  WashingMachine,
  Laptop,
  Bike,
  Camera,
  Wrench,
  Dumbbell,
  MoreHorizontal,
];

const TRUST_BADGES = [
  { icon: Shield, label: "Trusted Community" },
  { icon: Lock, label: "Secure Transactions" },
  { icon: Zap, label: "Fast & Reliable" },
  { icon: Users, label: "For Students, By Students" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.92, x: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.6,
      delay: 0.45,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("id, title, category, price, images")
          .eq("status", "approved")
          .order("total_bookings", { ascending: false })
          .limit(4);

        if (error) {
          console.error("Error fetching popular services:", error);
          setLoadingServices(false);
          return;
        }

        setPopularServices(data || []);
      } catch (error) {
        console.error("Error fetching popular services:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchPopularServices();
  }, []);

  const getCategoryIcon = (category: string) => {
    const key = category?.toLowerCase().trim();
    return CATEGORY_ICONS[key] || BookOpen;
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return `From GHS ${Number.isFinite(num) ? num.toFixed(0) : price}`;
  };

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          <Image
            src="/images/hero.jpg"
            alt="UCC Campus"
            fill
            sizes="100vw" // Tells Next.js to handle this as a full-viewport cover asset
            className="object-cover object-[75%_center]"
            priority
            onError={(e) => {
              const target = e.target as HTMLElement;
              target.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/35" />
        </div>
      </div>

      <motion.div
        className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 sm:pt-24"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center w-full">
          {/* Left column — copy */}
          <div className="max-w-xl">
            <motion.div
              variants={itemVariants}
              className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-2 font-heading"
            >
              Campus, Community, Connections.
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl font-heading leading-[1.1] tracking-tight text-foreground mb-3 sm:mb-4"
            >
              Your Campus
              <span className="block text-primary">Marketplace</span>
              for Every Need
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed font-body"
            >
              Buy, sell, or get help with trusted services from students and
              providers around you.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                size="lg"
                onClick={onGetStarted}
                className="h-11 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-7 border-primary/40 text-primary hover:bg-primary/5 rounded-xl"
                asChild
              >
                <Link href="/marketplace">Browse Services</Link>
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-2"
            >
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center gap-1.5"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-foreground leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column — floating Popular Services card */}
          <motion.div
            variants={cardVariants}
            className="relative lg:flex lg:justify-end hidden sm:block"
          >
            <div className="w-full max-w-xs bg-card rounded-2xl shadow-2xl border border-border p-4 lg:mr-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  Popular Services
                </h3>
                <Link
                  href="/marketplace"
                  aria-label="Browse all services"
                  className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {loadingServices ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-2/3 rounded bg-muted animate-pulse" />
                        <div className="h-2 w-1/2 rounded bg-muted animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : popularServices.length > 0 ? (
                  popularServices.map((service) => {
                    const Icon = getCategoryIcon(service.category);
                    const imageUrl = service.images?.[0];
                    return (
                      <Link
                        key={service.id}
                        href={`/marketplace/${service.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={service.title}
                              fill
                              sizes="36px" // Small fixed badge thumbnail item size mapping
                              className="object-cover"
                            />
                          ) : (
                            <Icon className="w-3.5 h-3.5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {service.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatPrice(service.price)}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    No services listed yet
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Wavy bottom divider */}
      <div className="relative z-10 mt-auto">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-16 sm:h-20 block"
        >
          <path
            d="M0 70C240 25 480 5 720 15C960 25 1200 70 1440 50V120H0V70Z"
            fill="var(--color-secondary)"
          />
        </svg>
        <div className="bg-secondary py-2.5 sm:py-3">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between sm:justify-center sm:gap-8 lg:gap-12">
              {CATEGORY_ICON_ROW.map((Icon, i) => (
                <Icon
                  key={i}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground/40"
                  strokeWidth={1.75}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
