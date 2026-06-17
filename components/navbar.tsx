"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Moon,
  Sun,
  Menu,
  X,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Home,
  Info,
  ShoppingBag,
  Mail,
} from "lucide-react";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "How it Works", href: "/how-it-works", icon: Info },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Contact", href: "/contact", icon: Mail },
];

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleGetStarted = () => {
    setIsMobileMenuOpen(false);
    if (user && profile) {
      const targetRole = profile.active_role || "student";
      router.push(`/${targetRole}/dashboard`);
    } else {
      router.push("/register");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const activeRoleRoute = profile?.active_role || "student";
  const isAuthed = !loading && !!user && !!profile;
  const isGuest = !loading && !user;

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-xl shadow-md border-b border-border/40"
            : "bg-background/80 backdrop-blur-md border-b border-border/20"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 md:h-20 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/logo.png"
                  alt="Kejetia Marketplace Logo"
                  width={100}
                  height={100}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-primary transition-all duration-300 group-hover:underline underline-offset-4">
                Kejetia
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-heading font-medium transition-colors duration-200 relative py-1.5 group ${
                      isActive
                        ? "text-primary"
                        : "text-foreground/80 hover:text-primary"
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 bg-primary transition-transform duration-200 ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                );
              })}

              {/* Seamless Inline Links for Logged-In Users instead of Dropdowns */}
              {isAuthed && (
                <>
                  <span className="h-4 w-px bg-border" />
                  <Link
                    href={`/${activeRoleRoute}/dashboard`}
                    className={`text-sm font-heading font-medium transition-colors duration-200 flex items-center gap-1.5 py-1.5 relative group ${
                      pathname.includes("/dashboard")
                        ? "text-primary"
                        : "text-foreground/80 hover:text-primary"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 bg-primary transition-transform duration-200 ${
                        pathname.includes("/dashboard")
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                  <Link
                    href={`/${activeRoleRoute}/profile`}
                    className={`text-sm font-heading font-medium transition-colors duration-200 flex items-center gap-1.5 py-1.5 relative group ${
                      pathname.includes("/profile")
                        ? "text-primary"
                        : "text-foreground/80 hover:text-primary"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {!mounted ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : theme === "dark" ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              {/* Contextual Auth Actions */}
              {loading ? (
                // Neutral placeholder while auth resolves — same footprint as
                // the real buttons, so there's no flash and no layout shift.
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
                  <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />
                </div>
              ) : isAuthed ? (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="hidden lg:flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium h-9 px-3"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    asChild
                    className="text-foreground hover:bg-muted font-medium h-9 px-4"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button
                    onClick={handleGetStarted}
                    className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium h-9 px-4 hover:shadow-sm transition-all"
                  >
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed top-16 left-0 right-0 bottom-0 z-40 lg:hidden animate-in slide-in-from-top duration-300">
            <div className="bg-background border-t border-border/20 h-full overflow-y-auto shadow-xl">
              <nav className="flex flex-col p-4 gap-1.5">
                {/* Loading placeholder (mobile) */}
                {loading && (
                  <div className="flex flex-col gap-3 pb-4 mb-2 border-b border-border/30">
                    <div className="h-12 w-full rounded-md bg-muted animate-pulse" />
                    <div className="h-12 w-full rounded-md bg-muted animate-pulse" />
                  </div>
                )}

                {/* Guest Actions (Mobile) */}
                {isGuest && (
                  <div className="flex flex-col gap-3 pb-4 mb-2 border-b border-border/30">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-center h-12 text-base"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button
                      className="w-full justify-center h-12 text-base bg-gradient-to-r from-primary to-primary/90"
                      onClick={handleGetStarted}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Base Links */}
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                        isActive
                          ? "text-primary bg-primary/5 font-semibold"
                          : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {link.name}
                    </Link>
                  );
                })}

                {/* Active Session Management Dashboard Links (Mobile) */}
                {isAuthed && (
                  <div className="mt-2 pt-4 border-t border-border/30 flex flex-col gap-1.5">
                    <Link
                      href={`/${activeRoleRoute}/dashboard`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        pathname.includes("/dashboard")
                          ? "text-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <LayoutDashboard className="w-5 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href={`/${activeRoleRoute}/profile`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        pathname.includes("/profile")
                          ? "text-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <User className="w-5 h-4" />
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors mt-2"
                    >
                      <LogOut className="w-5 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </>
      )}

      <div className="h-16 md:h-20" />
    </>
  );
}
