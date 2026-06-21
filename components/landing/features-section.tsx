"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, MessageSquare, Star, Zap } from "lucide-react";

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
  { value: "500+", label: "Active Students", icon: "Users" },
  { value: "120+", label: "Services Listed", icon: "Briefcase" },
  { value: "4.8", label: "Average Rating", icon: "Star" },
  { value: "98%", label: "Satisfaction Rate", icon: "CheckCircle" },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
            Get Started
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
            Everything You Need to Get Started
          </h2>
          <p className="text-muted-foreground font-body max-w-2xl mx-auto">
            Kejetia provides all the tools you need to offer or find services
            within the University of Cape Coast.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES_GRID.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300 group"
              >
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
            );
          })}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-8 border-t border-border/40">
          {STATS.map(({ value, label, icon: IconName }) => {
            const icons = {
              Users: require("lucide-react").Users,
              Briefcase: require("lucide-react").Briefcase,
              Star: require("lucide-react").Star,
              CheckCircle: require("lucide-react").CheckCircle,
            };
            const Icon = icons[IconName as keyof typeof icons];
            return (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {value}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
