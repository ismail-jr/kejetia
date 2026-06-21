"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Shield,
  MessageSquare,
  Star,
  Zap,
  Users,
  Briefcase,
  CheckCircle,
} from "lucide-react";

const FEATURES_GRID = [
  {
    icon: Shield,
    title: "UCC Verified Only",
    description:
      "Every user is verified with a UCC student email, ensuring a safe and trusted community.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Messaging",
    description:
      "Chat directly with service providers or students using our built-in messaging system.",
  },
  {
    icon: Star,
    title: "Trusted Reviews",
    description:
      "Make informed decisions with verified reviews from fellow UCC students.",
  },
  {
    icon: Zap,
    title: "Quick Bookings",
    description:
      "Book a service in seconds and manage all your appointments from one dashboard.",
  },
];

const STATS = [
  { target: 500, suffix: "+", label: "Active Students", icon: Users },
  { target: 120, suffix: "+", label: "Services Listed", icon: Briefcase },
  {
    target: 4.8,
    suffix: "",
    label: "Average Rating",
    icon: Star,
    isDecimal: true,
  },
  { target: 98, suffix: "%", label: "Satisfaction Rate", icon: CheckCircle },
];

// Reusable Counter Component using clean high-performance MotionValues
function Counter({
  target,
  suffix,
  isDecimal,
}: {
  target: number;
  suffix: string;
  isDecimal?: boolean;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const count = useMotionValue(0);
  const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

  // Dynamically format numbers as decimals or clean integers during the animation sequence
  const rounded = useTransform(count, (latest) =>
    isDecimal ? latest.toFixed(1) : Math.floor(latest).toString(),
  );

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(count, target, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1], // Smooth out-quint easing curve
    });

    return () => controls.stop();
  }, [count, target, isInView]);

  return (
    <span ref={nodeRef} className="text-2xl font-bold text-foreground">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

const headerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const gridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const statsContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
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

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={headerContainer}
        >
          <motion.div variants={itemVariants}>
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              Get Started
            </Badge>
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight"
          >
            Everything You Need to Get Started
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground font-body max-w-2xl mx-auto"
          >
            Kejetia provides all the tools you need to offer or find services
            within the University of Cape Coast.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={gridContainer}
        >
          {FEATURES_GRID.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300 group h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
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

        {/* Stats Row with Animated Number Counters */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-8 border-t border-border/40"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={statsContainer}
        >
          {STATS.map(({ target, suffix, label, icon: Icon, isDecimal }) => (
            <motion.div
              key={label}
              variants={itemVariants}
              className="text-center"
            >
              <div className="flex justify-center mb-2">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                <Counter
                  target={target}
                  suffix={suffix}
                  isDecimal={isDecimal}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
