"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell,
  Menu,
  Sun,
  Moon,
  LogOut,
  ArrowLeftRight,
  ChevronsUpDown,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
}

export default function DashboardLayout({
  children,
  navItems,
  title,
}: DashboardLayoutProps) {
  const { user, profile, signOut, activeRole, setActiveRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract active viewport state directly from route layout prefixes
  const pathRole = pathname.startsWith("/provider") ? "provider" : "student";

  // Enforce consistent context fallbacks
  const currentRole = activeRole ?? pathRole;
  const otherRole = currentRole === "student" ? "provider" : "student";

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSwitchRole = (role: "student" | "provider") => {
    setActiveRole(role);
    router.push(`/${role}/dashboard`);
  };

  // ── Sidebar
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <Image
              src="/images/logo.png"
              alt="Kejetia Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground leading-none">
              Kejetia
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-none capitalize font-medium">
              {currentRole} portal
            </p>
          </div>
        </Link>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Navigation
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 pb-4 space-y-2 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-110",
                  isActive ? "text-primary-foreground" : "",
                )}
              />
              <span className="flex-1 leading-none">{label}</span>
              {badge !== undefined && badge > 0 && (
                <Badge
                  className={cn(
                    "text-[10px] h-[18px] min-w-[18px] px-1.5 rounded-full flex items-center justify-center font-semibold",
                    isActive
                      ? "bg-white/20 text-white border-0"
                      : "bg-primary/10 text-primary border-0",
                  )}
                >
                  {badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom user dropdown ── */}
      <div className="p-3 border-t border-border/40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-all duration-150 group text-left">
              <div className="relative shrink-0">
                <Avatar className="w-8 h-8 ring-2 ring-border/60">
                  <AvatarImage src={profile?.avatar_url ?? ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-card" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {profile?.full_name?.split(" ")[0] ?? "User"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  {user?.email}
                </p>
              </div>

              <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 group-hover:text-muted-foreground transition-colors" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={6}
            className="w-64 rounded-xl p-1.5"
          >
            <DropdownMenuLabel className="px-3 py-2.5 font-normal">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={profile?.avatar_url ?? ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-popover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate leading-snug">
                    {profile?.full_name ?? "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate leading-snug">
                    {user?.email}
                  </p>
                  <span
                    className={cn(
                      "inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize",
                      currentRole === "provider"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {currentRole}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className="rounded-lg cursor-pointer gap-2.5 py-2"
            >
              <Link href={`/${currentRole}/profile`}>
                <User className="w-4 h-4 text-muted-foreground" />
                <span>View profile</span>
              </Link>
            </DropdownMenuItem>

            {otherRole && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Switch account
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    handleSwitchRole(otherRole as "student" | "provider")
                  }
                  className="rounded-lg cursor-pointer gap-2.5 py-2"
                >
                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize">
                      {otherRole} account
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Switch to {otherRole} portal
                    </span>
                  </div>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="rounded-lg cursor-pointer gap-2.5 py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 border-r border-border/50 flex-col fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-14 border-b border-border/50 bg-card/70 backdrop-blur-xl sticky top-0 z-10 flex items-center px-4 sm:px-6 gap-3">
          {/* Mobile hamburger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-60 p-0 border-r border-border/50"
            >
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Page title */}
          {title && (
            <h1 className="text-sm font-semibold text-foreground hidden sm:block tracking-tight">
              {title}
            </h1>
          )}

          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg relative"
              asChild
            >
              <Link href={`/${currentRole}/notifications`}>
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
