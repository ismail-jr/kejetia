"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  AlertTriangle,
  BarChart2,
  Shield,
  Settings,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Listings", href: "/admin/listings", icon: Briefcase },
  { label: "Approvals", href: "/admin/approvals", icon: CheckSquare },
  { label: "Reports", href: "/admin/reports", icon: AlertTriangle },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  // { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!activeRole) return;

    if (activeRole === "admin") return;

    router.push(`/${activeRole}/dashboard`);
  }, [user, activeRole, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If the user isn't an admin, show the loading spinner while the useEffect redirects them.
  if (activeRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DashboardLayout navItems={NAV_ITEMS}>{children}</DashboardLayout>;
}
