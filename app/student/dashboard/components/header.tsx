"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  fullName?: string | null;
}

export function DashboardHeader({ fullName }: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  const firstName = fullName?.split(" ")[0] || "Student";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-foreground font-heading tracking-tight">
          Good {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Here's what's happening with your services today.
        </p>
      </div>
      <Button asChild className="shadow-primary font-heading font-semibold">
        <Link href="/student/browse">
          <Search className="mr-2 w-4 h-4 stroke-[2.5]" />
          Find a Service
        </Link>
      </Button>
    </div>
  );
}
