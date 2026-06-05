"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import {
  ArrowRight,
  BookOpen,
  Star,
  Shield,
  Users,
  MessageSquare,
  Zap,
  CheckCircle,
  Search,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Palette,
  Code,
  Camera,
  PenTool,
  Music,
  Dumbbell,
  Utensils,
  Sparkles,
  Heart,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const FEATURES_GRID = [
  {
    icon: Shield,
    title: "UCC Verified Only",
    description:
      "Every user is verified with a UCC student email, ensuring a safe and trusted community.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Messaging",
    description:
      "Chat directly with service providers or students using our built-in messaging system.",
  },
  {
    icon: Star,
    title: "Trusted Reviews",
    description:
      "Make informed decisions with verified reviews from fellow UCC students.",
  },
  {
    icon: Zap,
    title: "Quick Bookings",
    description:
      "Book a service in seconds and manage all your appointments from one dashboard.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Sign Up with UCC Email",
    description:
      "Register using your official UCC student email and verify your identity with an OTP.",
    icon: GraduationCap,
  },
  {
    number: "02",
    title: "Browse or List Services",
    description:
      "Find the services you need or create a listing to offer your own skills to fellow students.",
    icon: Search,
  },
  {
    number: "03",
    title: "Connect & Collaborate",
    description:
      "Book services, chat in real-time, complete work, and leave verified reviews.",
    icon: TrendingUp,
  },
];

const TESTIMONIALS = [
  {
    name: "Abena Mensah",
    role: "Level 300 • Computer Science",
    avatar: "AM",
    text: "I found a great tutor for my algorithms course within hours. The platform is so easy to use!",
    rating: 5,
  },
  {
    name: "Kwame Asante",
    role: "Level 200 • Business Admin",
    avatar: "KA",
    text: "I've been offering graphic design services and have already completed 12 orders. UCC Connect changed my campus life.",
    rating: 5,
  },
  {
    name: "Ama Boateng",
    role: "Level 400 • Education",
    avatar: "AB",
    text: "The verification system makes me feel safe. I know I'm dealing with real UCC students every time.",
    rating: 5,
  },
  {
    name: "Michael Osei",
    role: "Level 100 • Engineering",
    avatar: "MO",
    text: "Found a programming tutor who helped me ace my exams. Highly recommend!",
    rating: 5,
  },
  {
    name: "Sarah Johnson",
    role: "Level 200 • Law",
    avatar: "SJ",
    text: "I offer proofreading services and have built a steady client base. Great platform!",
    rating: 5,
  },
  {
    name: "David Acquah",
    role: "Level 400 • Economics",
    avatar: "DA",
    text: "The verification system gives me confidence that I'm dealing with real UCC students.",
    rating: 5,
  },
];

const CATEGORIES = [
  { icon: Palette, name: "Design", count: 24 },
  { icon: Code, name: "Programming", count: 18 },
  { icon: BookOpen, name: "Tutoring", count: 35 },
  { icon: Camera, name: "Photography", count: 12 },
  { icon: PenTool, name: "Writing", count: 21 },
  { icon: Music, name: "Music", count: 9 },
  { icon: Dumbbell, name: "Fitness", count: 7 },
  { icon: Utensils, name: "Cooking", count: 5 },
];

export default function LandingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user && profile) {
      router.push(`/${profile.role}/dashboard`);
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section with Background Image */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <Image
              src="/images/hero.jpg"
              alt="UCC Campus"
              fill
              className="object-cover"
              priority
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = "none";
              }}
            />

            <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
          <div className="max-w-2xl">
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              <Shield className="font-heading w-3.5 h-3.5 mr-1.5" />
              Exclusively for UCC Students
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-heading mb-6 leading-tight tracking-tight">
              Skills & Services,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                Campus to Campus
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg font-body">
              Kejetia is the verified peer-to-peer marketplace where University
              of Cape Coast students offer and discover services from tutoring
              to design, all within your campus community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              >
                Start Exploring
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 border-border bg-background/80 backdrop-blur-sm text-foreground hover:bg-muted"
                asChild
              >
                <Link href="/login">
                  Offer a Service
                  <Sparkles className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-success" /> UCC email
                required
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" /> Safe & Verified
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-warning fill-warning" /> Rated
                4.8/5
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce hidden sm:block">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Everything You Need to Get Started Section */}
      <section className="py-20 bg-muted/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              Get Started
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
              Everything You Need to Get Started
            </h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              UCC Connect provides all the tools you need to offer or find
              services within the UCC community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES_GRID.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-8 border-t border-border/40">
            {[
              { value: "500+", label: "Active Students", icon: Users },
              { value: "120+", label: "Services Listed", icon: Briefcase },
              { value: "4.8", label: "Average Rating", icon: Star },
              { value: "98%", label: "Satisfaction Rate", icon: CheckCircle },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {value}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-heading mb-4 tracking-tight">
              Popular Categories
            </h2>
            <p className="text-muted-foreground font-body">
              Browse services across various categories
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map(({ icon: CategoryIcon, name, count }) => (
              <Link
                key={name}
                href="/student/browse"
                className="group flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-2 transition-colors">
                  <CategoryIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-heading text-foreground group-hover:text-primary transition-colors">
                  {name}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {count} services
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-muted/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              <Star className="w-3 h-3 mr-1" />
              Trusted by Students
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-heading mb-4 tracking-tight">
              What UCC Students Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-body">
              Join hundreds of satisfied students who have found success through
              UCC Connect
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, avatar, text, rating }, idx) => (
              <Card
                key={idx}
                className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-warning text-warning"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground font-heading mb-4 text-sm leading-relaxed line-clamp-3">
                  "{text}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center text-sm font-bold text-primary">
                    {avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {name}
                    </div>
                    <div className="text-xs text-muted-foreground">{role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="ghost" className="gap-2" asChild>
              <Link href="/reviews">
                Read All Reviews
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Steps to Get Started Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              Simple Process
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-heading mb-4 tracking-tight">
              How UCC Connect Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-body">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  {idx < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/3 left-full w-full h-0.5 bg-gradient-to-r from-primary/20 to-transparent -translate-y-1/2" />
                  )}
                  <div className="text-center">
                    <div className="relative inline-flex mb-6">
                      <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-y border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-heading mb-4 tracking-tight">
            Ready to Kejetia?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto font-body">
            Join hundreds of UCC students already using UCC Connect to learn,
            earn, and grow together.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
