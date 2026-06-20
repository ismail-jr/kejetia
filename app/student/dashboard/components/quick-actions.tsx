"use client";

import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Search,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const QUICK_ACTIONS = [
  {
    icon: Search,
    label: "Browse Services",
    href: "/student/browse",
    color: "text-primary bg-primary/5",
  },
  {
    icon: Heart,
    label: "Saved Services",
    href: "/student/saved",
    color: "text-red-500 bg-red-500/5",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    href: "/student/messages",
    color: "text-blue-500 bg-blue-500/5",
  },
  {
    icon: TrendingUp,
    label: "My Profile",
    href: "/student/profile",
    color: "text-green-500 bg-green-500/5",
  },
];

export function QuickActions() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
      <h2 className="font-bold font-heading text-foreground mb-4 tracking-tight">
        Quick Actions
      </h2>
      <div className="space-y-2">
        {QUICK_ACTIONS.map(({ icon: Icon, label, href, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border/40 hover:bg-muted/50 transition-all duration-150 group"
          >
            <div className={`p-2 rounded-lg shrink-0 ${color}`}>
              <Icon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-bold text-foreground/90 font-heading tracking-wide">
              {label}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 ml-auto transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
