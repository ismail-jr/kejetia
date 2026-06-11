"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";

export function ServiceHeader() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Service</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit a new service listing for review
          </p>
        </div>
      </div>

      <Card className="rounded-2xl p-4 bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary/80">
            After submitting, your service will be reviewed by an admin within
            24 hours before it becomes visible to students.
          </p>
        </div>
      </Card>
    </div>
  );
}
