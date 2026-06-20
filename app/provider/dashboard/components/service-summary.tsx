"use client";

import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  title: string;
  price: number;
  status: string;
}

interface MyServicesSummaryProps {
  services: Service[];
}

export function MyServicesSummary({ services }: MyServicesSummaryProps) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold font-heading text-foreground tracking-tight">
          My Services
        </h2>
        <Link
          href="/provider/services"
          className="text-xs font-bold font-heading text-primary hover:underline tracking-wide uppercase"
        >
          Manage
        </Link>
      </div>
      {services.length === 0 ? (
        <div className="text-center py-6">
          <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground mb-3">
            No services yet
          </p>
          <Button size="sm" asChild className="font-heading">
            <Link href="/provider/create">
              <Plus className="mr-1 w-3.5 h-3.5 stroke-[2.5]" />
              Create Service
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.slice(0, 5).map((service) => (
            <div
              key={service.id}
              className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:bg-muted/30 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground font-heading truncate">
                  {service.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  GH₵{service.price}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex-shrink-0",
                  service.status === "approved"
                    ? "bg-success/15 text-success"
                    : service.status === "pending"
                      ? "bg-warning/15 text-warning"
                      : service.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {service.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
