"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LayoutDashboard,
  Heart,
  Calendar,
  MessageSquare,
  Bell,
  User,
  Settings,
  Layers,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Browse Services", href: "/student/browse", icon: Layers },
  { label: "Bookings", href: "/student/bookings", icon: Calendar },
  { label: "Saved", href: "/student/saved", icon: Heart },
  { label: "Messages", href: "/student/messages", icon: MessageSquare },
  { label: "Notifications", href: "/student/notifications", icon: Bell },
  { label: "Profile", href: "/student/profile", icon: User },
  // { label: "Settings", href: "/student/settings", icon: Settings },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      !loading &&
      (!user ||
        (profile && profile.role !== "student" && profile.role !== "provider"))
    ) {
      if (!user) router.push("/login");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DashboardLayout navItems={NAV_ITEMS}>{children}</DashboardLayout>;
}
