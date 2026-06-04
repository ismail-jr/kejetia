"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchX, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-2xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-8">
          <SearchX className="h-4 w-4" />
          Error 404
        </div>

        {/* 404 */}
        <h1 className="font-heading text-7xl md:text-9xl font-black text-primary mb-4">
          404
        </h1>

        {/* Title */}
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          The page you're looking for doesn't exist, may have been moved, or the
          link may be incorrect.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-[#2563EB] to-[#A4133C] text-white"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back Home
            </Link>
          </Button>

          <Button variant="outline" size="lg" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </main>
  );
}
