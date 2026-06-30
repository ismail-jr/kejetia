"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PublicProviderProfileView } from "@/components/profile/public-provider-profile-view";
import {
  getProviderPublicPageData,
  type ProviderPublicPageData,
} from "@/lib/data";

export default function ProviderPublicPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProviderPublicPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!params.id) return;
      setLoading(true);
      try {
        const pageData = await getProviderPublicPageData(params.id);
        if (cancelled) return;
        if (!pageData) {
          setNotFound(true);
          setData(null);
        } else {
          setData(pageData);
          setNotFound(false);
        }
      } catch (err) {
        console.error("Failed to load provider profile:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {loading ? (
          <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
            <div className="h-40 rounded-2xl animate-pulse bg-muted" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-48 rounded-2xl animate-pulse bg-muted" />
              <div className="md:col-span-2 h-48 rounded-2xl animate-pulse bg-muted" />
            </div>
            <div className="h-64 rounded-2xl animate-pulse bg-muted" />
          </div>
        ) : notFound || !data ? (
          <div className="max-w-lg mx-auto px-4 py-24 text-center">
            <h1 className="text-2xl font-bold font-heading text-foreground">
              Provider not found
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              This profile does not exist or is not available publicly.
            </p>
          </div>
        ) : (
          <PublicProviderProfileView data={data} />
        )}
      </main>
      <Footer />
    </div>
  );
}
