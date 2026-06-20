"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  fullName?: string | null;
}

export function DashboardHeader({ fullName }: DashboardHeaderProps) {
  const firstName = fullName?.split(" ")[0] || "Provider";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-foreground font-heading tracking-tight">
          Provider Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Welcome back, {firstName} 👋
        </p>
      </div>
      <Button asChild className="font-heading font-semibold">
        <Link href="/provider/create">
          <Plus className="mr-2 w-4 h-4 stroke-[2.5]" />
          New Service
        </Link>
      </Button>
    </div>
  );
}
