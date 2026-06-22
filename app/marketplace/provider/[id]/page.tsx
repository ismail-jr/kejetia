"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProviderPreview } from "@/components/profile/provider-preview";

export default function ProviderPreviewPage() {
  const params = useParams();
  const router = useRouter();

  // Convert id to string with proper null/undefined handling
  const id = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : "";

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground">
                Provider ID missing
              </h2>
              <p className="text-muted-foreground mt-2">
                Invalid provider profile link.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Provider Preview Component */}
          <ProviderPreview providerId={id} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
