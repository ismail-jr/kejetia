"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserPlus,
  MessageSquare,
  Calendar,
  Star,
  ArrowRight,
  Shield,
  Smartphone,
  Wallet,
  Clock,
  Users,
  CheckCircle,
  GraduationCap,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description:
      "Sign up using your official UCC student email. Verify your identity and complete your profile to get started.",
    details: [
      "UCC email verification required",
      "Complete your student profile",
      "Set your availability and preferences",
    ],
  },
  {
    icon: Search,
    title: "Browse Services",
    description:
      "Explore a wide range of services offered by fellow UCC students. Use filters to find exactly what you need.",
    details: [
      "Search by category or keywords",
      "Filter by price, rating, and more",
      "View provider profiles and reviews",
    ],
  },
  {
    icon: MessageSquare,
    title: "Connect & Book",
    description:
      "Chat with providers, ask questions, and book services directly through the platform.",
    details: [
      "Real-time messaging with providers",
      "Secure booking system",
      "Manage all appointments in one place",
    ],
  },
  {
    icon: Star,
    title: "Review & Earn",
    description:
      "After service completion, leave a review. Providers build reputation and earn from their skills.",
    details: [
      "Rate and review providers",
      "Build your reputation as a provider",
      "Earn money from your skills",
    ],
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Verified Community",
    description:
      "Every user is verified with a UCC student email, creating a safe and trusted environment.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Access the platform from any device. Book services on the go from your phone or tablet.",
  },
  {
    icon: Wallet,
    title: "Secure Transactions",
    description:
      "All payments are handled securely through the platform with transparent pricing.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description:
      "Book services at times that work for you. Providers set their own availability.",
  },
  {
    icon: Users,
    title: "Peer-to-Peer",
    description:
      "Connect directly with fellow UCC students. Build meaningful connections on campus.",
  },
  {
    icon: GraduationCap,
    title: "Student Focused",
    description:
      "Designed specifically for UCC students. Everything is tailored to student needs.",
  },
];

const STATS = [
  { value: "500+", label: "Active Students", icon: Users },
  { value: "120+", label: "Services Offered", icon: Star },
  { value: "4.8/5", label: "Average Rating", icon: Star },
  { value: "98%", label: "Satisfaction Rate", icon: CheckCircle },
];

// Shared timing language across the whole page, matching the landing page
// and marketplace pacing — slow enough to read as deliberate, not rushed.
const headerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25, delayChildren: 0.1 },
  },
};

const gridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
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

const heroItemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section — animates on mount since it's above the fold */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <motion.div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            initial="hidden"
            animate="visible"
            variants={headerContainer}
          >
            <div className="text-center max-w-3xl mx-auto">
              <motion.div variants={heroItemVariants}>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  How It Works
                </Badge>
              </motion.div>
              <motion.h1
                variants={heroItemVariants}
                className="text-4xl md:text-5xl font-heading text-foreground mb-4"
              >
                Your Campus Marketplace
                <span className="my-4 block text-primary">
                  in 4 Simple Steps
                </span>
              </motion.h1>
              <motion.p
                variants={heroItemVariants}
                className="text-lg text-muted-foreground leading-relaxed"
              >
                Kejetia connects UCC students to offer and discover services
                within the campus community. Here's how to get started.
              </motion.p>
            </div>
          </motion.div>
        </section>

        {/* Steps Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid md:grid-cols-2 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={gridContainer}
            >
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300 group h-full">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-7 h-7 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-primary">
                              Step {index + 1}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              •
                            </span>
                            <h3 className="font-semibold text-foreground">
                              {step.title}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {step.description}
                          </p>
                          <ul className="space-y-1">
                            {step.details.map((detail, i) => (
                              <li
                                key={i}
                                className="text-xs text-muted-foreground flex items-center gap-2"
                              >
                                <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={headerContainer}
            >
              <motion.div variants={itemVariants}>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                  Features
                </Badge>
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold text-foreground mb-3"
              >
                Why Choose Kejetia?
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground max-w-2xl mx-auto"
              >
                Everything you need to connect, collaborate, and grow within the
                UCC community.
              </motion.p>
            </motion.div>
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={gridContainer}
            >
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="p-6 bg-card border-border hover:shadow-md transition-all h-full">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={gridContainer}
            >
              {STATS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <motion.div
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={headerContainer}
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-foreground mb-4"
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-muted-foreground mb-8 max-w-xl mx-auto"
            >
              Join hundreds of UCC students already using Kejetia to learn,
              earn, and grow together.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button asChild className="rounded-xl px-8 gap-2">
                <Link href="/register">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl px-8">
                <Link href="/marketplace">Browse Services</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
