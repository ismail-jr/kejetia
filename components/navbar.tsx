"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Home,
  Info,
  ShoppingBag,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "How it Works", href: "/how-it-works", icon: Info },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Contact", href: "/contact", icon: Mail },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
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
      router.push(`/${profile.role}/dashboard`);
    } else {
      router.push("/register");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-xl shadow-lg border-b border-border/20"
            : "bg-background/80 backdrop-blur-md border-b border-border/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 md:h-20 items-center justify-between gap-4">
            {/* Logo - Responsive sizing */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 md:gap-4 group flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/logo.png"
                  alt="UCC Connect Logo"
                  width={120}
                  height={120}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
              <span className="font-heading text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-primary transition-all duration-300 group-hover:underline underline-offset-4">
                Kejetia
              </span>
            </Link>

            {/* Desktop Navigation - hidden on mobile/tablet */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-heading text-foreground/80 hover:text-primary transition-colors duration-200 relative group"
                >
                  {link.name}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Theme Toggle - responsive sizing */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              )}

              {/* User Menu or Auth Buttons */}
              {user && profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 sm:gap-2 rounded-lg hover:bg-muted p-1 transition-colors touch-manipulation">
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium truncate">
                          {profile.full_name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/${profile.role}/dashboard`}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${profile.role}/profile`}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2 md:gap-3">
                  <Button
                    variant="ghost"
                    asChild
                    className="text-foreground hover:bg-muted font-medium h-9 sm:h-10 px-3 sm:px-4"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium h-9 sm:h-10 px-4 sm:px-5 hover:shadow-md transition-all"
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button - larger touch target */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed top-16 md:top-20 left-0 right-0 bottom-0 z-40 lg:hidden animate-in slide-in-from-top duration-300">
            <div className="bg-background border-t border-border/20 h-full overflow-y-auto">
              <nav className="flex flex-col p-4 gap-2">
                {/* Mobile auth buttons for small screens */}
                {!user && !profile && (
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
                      asChild
                      className="w-full justify-center h-12 text-base bg-gradient-to-r from-primary to-primary/90"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/register">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Navigation Links */}
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-200 active:bg-primary/10"
                    >
                      <Icon className="w-5 h-5" />
                      {link.name}
                    </Link>
                  );
                })}

                {/* User profile section in mobile menu */}
                {user && profile && (
                  <>
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {profile.full_name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href={`/${profile.role}/dashboard`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          href={`/${profile.role}/profile`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-16 md:h-20" />
    </>
  );
}
