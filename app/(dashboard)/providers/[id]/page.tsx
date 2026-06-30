// app/(dashboard)/providers/[id]/page.tsx
import { notFound } from "next/navigation";
import { PublicPreviewView } from "@/components/profile/public-preview-view";
import { getProviderPublicProfile } from "@/lib/data";

interface ProviderPublicPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProviderPublicPage({
  params,
}: ProviderPublicPageProps) {
  const resolvedParams = await params;
  // Merges the identity row (profiles) with the provider extension
  // (provider_profiles) where availability now lives.
  const provider = await getProviderPublicProfile(resolvedParams.id);

  if (!provider) {
    notFound();
  }

  return <PublicPreviewView provider={provider} />;
}
