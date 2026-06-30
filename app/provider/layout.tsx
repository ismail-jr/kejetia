"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Star,
  BarChart2,
  MessageSquare,
  Bell,
  User,
  Settings,
  PencilRuler,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/provider/dashboard", icon: LayoutDashboard },
  { label: "Create Service", href: "/provider/create", icon: PencilRuler },
  { label: "My Services", href: "/provider/services", icon: Briefcase },
  { label: "Orders", href: "/provider/orders", icon: ClipboardList },
  { label: "Reviews", href: "/provider/reviews", icon: Star },
  { label: "Analytics", href: "/provider/analytics", icon: BarChart2 },
  { label: "Messages", href: "/provider/messages", icon: MessageSquare },
  { label: "Notifications", href: "/provider/notifications", icon: Bell },
  { label: "Profile", href: "/provider/profile", icon: User },
  // { label: "Settings", href: "/provider/settings", icon: Settings },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, roles, setActiveRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (profile?.active_role === "admin" || roles.includes("admin")) {
      router.push("/admin/dashboard");
      return;
    }

    // Must hold the provider role (row in provider_profiles), not just be
    // browsing with active_role still set to student from a prior session.
    if (!roles.includes("provider")) {
      router.replace(
        roles.includes("student") ? "/register?role=provider" : "/role-selection",
      );
      return;
    }

    // Entering any /provider/* route implies the provider workspace — keep
    // active_role in sync so create-service and other checks pass.
    if (profile?.active_role !== "provider") {
      void setActiveRole("provider");
    }
  }, [user, profile, loading, roles, router, setActiveRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DashboardLayout navItems={NAV_ITEMS}>{children}</DashboardLayout>;
}
