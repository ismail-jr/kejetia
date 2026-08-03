"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Menu,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { toast } from "sonner";

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
  const { user, profile, signOut, roles, activeRole, setActiveRole, loading } =
    useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Security & Sync Guard for Workspace States
  useEffect(() => {
    if (loading || !pathname || !activeRole || isSwitching) return;

    const currentUrlRole = pathname.split("/")[1] as UserRole;
    const standardRoles: UserRole[] = ["student", "provider", "admin"];

    if (
      standardRoles.includes(currentUrlRole) &&
      currentUrlRole !== activeRole
    ) {
      if (roles?.includes(currentUrlRole)) {
        setActiveRole?.(currentUrlRole);
      } else {
        toast.error("Unauthorized workspace access.");
        router.replace(`/${activeRole}/dashboard`);
      }
    }
  }, [pathname, activeRole, isSwitching, router, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect system profile securely.");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
    }
  };

  const handleSwitchRole = async (role: "student" | "provider" | "admin") => {
    if (isSwitching || role === activeRole) return;
    setIsSwitching(true);

    try {
      await setActiveRole(role);
      router.push(`/${role}/dashboard`);
      toast.success(`Switched view to ${role} workspace`);
    } catch (err) {
      toast.error("Failed to swap operational scopes");
    } finally {
      setIsSwitching(false);
    }
  };

  const alternativeRoles = (roles || []).filter((r) => r !== activeRole);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      <div className="px-6 py-6 border-b border-border/40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <Logo alt="Kejetia" size={30} />
          </div>
          <div>
            <p className="text-base font-black tracking-tight text-foreground leading-none font-heading">
              Kejetia
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-none capitalize font-medium tracking-wide">
              {activeRole} portal
            </p>
          </div>
        </Link>
      </div>

      <div className="px-6 pt-6 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Navigation
        </p>
      </div>

      <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center gap-4 px-4 py-3 rounded-xl text-[15px] font-semibold font-heading transition-all duration-150 tracking-wide",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-110",
                  isActive
                    ? "text-secondary"
                    : "text-muted-foreground/80 group-hover:text-foreground",
                )}
              />
              <span className="flex-1 leading-none pt-0.5">{label}</span>
              {badge !== undefined && badge > 0 && (
                <Badge
                  className={cn(
                    "text-[11px] h-5 min-w-[20px] px-2 rounded-full flex items-center justify-center font-bold border-0 shadow-none",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/40 bg-muted/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/80 active:bg-muted transition-all duration-200 group text-left outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="relative flex-shrink-0">
                <UserAvatar
                  name={profile?.full_name}
                  avatarUrl={profile?.avatar_url}
                  className={cn(
                    "w-10 h-10 transition-transform duration-200 group-hover:scale-105",
                    activeRole === "provider" && "ring-2 ring-amber-500/30",
                    activeRole === "admin" && "ring-2 ring-red-500/30",
                    activeRole === "student" && "ring-2 ring-primary/30",
                  )}
                  fallbackClassName="bg-primary/10 text-primary text-sm font-bold"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-card" />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate leading-none font-heading">
                    {profile?.full_name ?? "User"}
                  </p>
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider select-none leading-none shrink-0 scale-90 origin-left",
                      activeRole === "provider" &&
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      activeRole === "admin" &&
                        "bg-red-500/10 text-red-600 dark:text-red-400",
                      activeRole === "student" && "bg-primary/10 text-primary",
                    )}
                  >
                    {activeRole}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/80 truncate mt-1.5 leading-none font-medium">
                  {user?.email}
                </p>
              </div>

              <ChevronDown className="w-4 h-4 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0 ml-1" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="top"
            className="w-60 side-top animate-in fade-in-50 slide-in-from-bottom-2 duration-200 rounded-xl"
          >
            <DropdownMenuLabel className="p-3 font-heading">
              <div className="space-y-1">
                <p className="font-bold text-sm truncate">
                  {profile?.full_name}
                </p>
                <p className="text-xs font-normal text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled
              className="text-xs font-semibold focus:bg-transparent opacity-90"
            >
              <CheckCircle2
                className={cn(
                  "mr-2 h-4 w-4",
                  activeRole === "provider" && "text-amber-500",
                  activeRole === "admin" && "text-red-500",
                  activeRole === "student" && "text-primary",
                )}
              />
              <span className="capitalize">Active: {activeRole} Mode</span>
            </DropdownMenuItem>

            {alternativeRoles.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {alternativeRoles.map((roleString) => (
                  <DropdownMenuItem
                    key={roleString}
                    onClick={() =>
                      handleSwitchRole(
                        roleString as "student" | "provider" | "admin",
                      )
                    }
                    disabled={isSwitching}
                    className="cursor-pointer font-semibold text-xs py-2 data-[disabled]:opacity-50"
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">
                      Switch to {roleString} Portal
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            <DropdownMenuSeparator />

            {/* Changed from direct call to controlled Dialog state activation */}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault(); // Prevents menu closure disrupting dialog alignment
                setIsLogoutDialogOpen(true);
              }}
              className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-semibold text-xs py-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-64 border-r border-border/50 flex-col fixed h-full z-20">
        <SidebarContent />
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border/50 bg-card/70 backdrop-blur-xl sticky top-0 z-10 flex items-center px-4 sm:px-6 gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 p-0 border-r border-border/50"
            >
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {title && (
            <h1 className="text-base font-bold text-foreground hidden sm:block tracking-tight font-heading">
              {title}
            </h1>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-muted-foreground" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-muted-foreground" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg relative"
              asChild
            >
              <Link href={`/${activeRole}/notifications`}>
                <Bell className="w-4.5 h-4.5 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Global Context Confirmation Dialog Markup */}
      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <AlertDialogContent className="rounded-2xl max-w-[380px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading font-bold">
              Confirm Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to log out of your profile session? You will
              need to log back in to access your portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={isLoggingOut}
              className="rounded-xl font-semibold text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSignOut();
              }}
              disabled={isLoggingOut}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-semibold text-xs"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                "Sign Out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
