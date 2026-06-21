"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, GraduationCap, Search, TrendingUp } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Sign Up with UCC Email",
    description:
      "Register using your official UCC student email and verify your identity with an OTP.",
    icon: GraduationCap,
  },
  {
    number: "02",
    title: "Browse or List Services",
    description:
      "Find the services you need or create a listing to offer your own skills to fellow students.",
    icon: Search,
  },
  {
    number: "03",
    title: "Connect & Collaborate",
    description:
      "Book services, chat in real-time, complete work, and leave verified reviews.",
    icon: TrendingUp,
  },
];

interface StepsSectionProps {
  onGetStarted: () => void;
}

// Header (badge + heading + paragraph) staggers in as one group.
const headerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

// Steps stagger in as their own group, once in view.
const stepsContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25, delayChildren: 0.1 },
  },
};

const headerItemVariants = {
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

// Each step pops in with a slightly bigger "punch" since there are only 3.
const stepVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 24 },
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

// Connecting line draws in from left to right after its step pops in.
const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
      delay: 0.3,
    },
  },
};

const ctaVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 18 },
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

export function StepsSection({ onGetStarted }: StepsSectionProps) {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={headerContainer}
        >
          <motion.div variants={headerItemVariants}>
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              Simple Process
            </Badge>
          </motion.div>
          <motion.h2
            variants={headerItemVariants}
            className="text-3xl lg:text-4xl font-heading mb-4 tracking-tight"
          >
            How UCC Connect Works
          </motion.h2>
          <motion.p
            variants={headerItemVariants}
            className="text-muted-foreground max-w-2xl mx-auto font-body"
          >
            Get started in minutes with our simple three-step process
          </motion.p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stepsContainer}
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                variants={stepVariants}
                className="relative"
              >
                {idx < STEPS.length - 1 && (
                  <motion.div
                    variants={lineVariants}
                    style={{ transformOrigin: "left center" }}
                    className="hidden md:block absolute top-1/3 left-full w-full h-0.5 bg-gradient-to-r from-primary/20 to-transparent -translate-y-1/2"
                  />
                )}
                <div className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          className="text-center mt-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={ctaVariants}
        >
          <Button
            size="lg"
            onClick={onGetStarted}
            className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
