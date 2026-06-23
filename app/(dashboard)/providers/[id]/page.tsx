// app/(dashboard)/providers/[id]/page.tsx
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { PublicPreviewView } from "@/components/profile/public-preview-view";

interface ProviderPublicPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPublicProviderProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, bio, location, phone, avatar_url, available_days, available_time, roles",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export default async function ProviderPublicPage({
  params,
}: ProviderPublicPageProps) {
  const resolvedParams = await params;
  const provider = await getPublicProviderProfile(resolvedParams.id);

  if (!provider) {
    notFound();
  }

  return <PublicPreviewView provider={provider} />;
}
