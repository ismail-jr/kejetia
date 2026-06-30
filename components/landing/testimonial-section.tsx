"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, CalendarDays } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  studentId: string;
  avatar: string;
  text: string;
  rating: number;
  serviceTitle: string;
  reviewedAt: string;
}

const headerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};
const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <Card className="p-6 bg-card border-border h-full flex flex-col gap-4">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-4 h-4 rounded-sm bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-5 bg-muted rounded-full animate-pulse w-32" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-3 bg-muted rounded animate-pulse w-4/6" />
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-border/40">
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-muted rounded animate-pulse w-28" />
          <div className="h-2.5 bg-muted rounded animate-pulse w-20" />
        </div>
        <div className="h-2.5 bg-muted rounded animate-pulse w-16" />
      </div>
    </Card>
  );
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        // ── 1. Reviews only — no joins ────────────────────────────────────
        const { data: reviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("id, rating, comment, reviewer_id, service_id, created_at")
          .order("created_at", { ascending: false })
          .limit(6);

        if (reviewsError) {
          console.error("[Testimonials] reviews error:", reviewsError.message);
          setTestimonials([]);
          return;
        }

        if (!reviews || reviews.length === 0) {
          setTestimonials([]);
          return;
        }

        // ── 2. Profiles ───────────────────────────────────────────────────
        const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, student_id")
          .in("user_id", reviewerIds);

        if (profilesError) {
          console.error(
            "[Testimonials] profiles error:",
            profilesError.message,
          );
        }

        const profileMap = new Map<string, any>();
        (profiles ?? []).forEach((p) => profileMap.set(p.user_id, p));

        // ── 3. Services ───────────────────────────────────────────────────
        const serviceIds = [
          ...new Set(reviews.map((r) => r.service_id).filter(Boolean)),
        ];

        const { data: services, error: servicesError } = await supabase
          .from("services")
          .select("id, title")
          .in("id", serviceIds);

        if (servicesError) {
          console.error(
            "[Testimonials] services error:",
            servicesError.message,
          );
        }

        const serviceMap = new Map<string, string>();
        (services ?? []).forEach((s) => serviceMap.set(s.id, s.title));

        // ── 4. Merge ──────────────────────────────────────────────────────
        const transformed: Testimonial[] = reviews.map((review) => {
          const profile = profileMap.get(review.reviewer_id);
          const fullName: string = profile?.full_name ?? "UCC Student";
          const studentId: string = profile?.student_id ?? "UCC Student";
          const avatar: string =
            profile?.avatar_url ??
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;

          return {
            id: review.id,
            name: fullName,
            studentId,
            avatar,
            text:
              review.comment?.trim() || "Great service! Highly recommended.",
            rating: Math.min(5, Math.max(1, review.rating ?? 5)),
            serviceTitle: serviceMap.get(review.service_id) ?? "Campus Service",
            reviewedAt: review.created_at ? formatDate(review.created_at) : "",
          };
        });

        setTestimonials(transformed);
      } catch (err) {
        console.error("[Testimonials] unexpected error:", err);
        setTestimonials([]);
      }
    };

    fetchTestimonials();
  }, []);

  const isLoading = testimonials === null;

  return (
    <section className="py-20 bg-muted/30 border-y border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={headerContainer}
        >
          <motion.div variants={itemVariants}>
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                className="mr-1"
              >
                <path
                  fill="orange"
                  d="M9.6 15.65L12 13.8l2.4 1.85l-.9-3.05l2.25-1.6h-2.8L12 7.9l-.95 3.1h-2.8l2.25 1.6zM5.825 21l2.325-7.6L2 9h7.6L12 1l2.4 8H22l-6.15 4.4l2.325 7.6L12 16.3zM12 11.775"
                />
              </svg>
              Trusted by Students
            </Badge>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-3xl lg:text-4xl font-heading mb-4 tracking-tight"
          >
            What UCC Students Say
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-muted-foreground max-w-2xl mx-auto font-body"
          >
            Join hundreds of satisfied students who have found success through
            UCC Connect
          </motion.p>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No reviews yet. Be the first to leave one!
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={gridContainer}
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.id} variants={itemVariants}>
                <Card className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        className="w-4 h-4"
                      >
                        <path
                          fill={i < testimonial.rating ? "orange" : "#d1d5db"}
                          d="M9.6 15.65L12 13.8l2.4 1.85l-.9-3.05l2.25-1.6h-2.8L12 7.9l-.95 3.1h-2.8l2.25 1.6zM5.825 21l2.325-7.6L2 9h7.6L12 1l2.4 8H22l-6.15 4.4l2.325 7.6L12 16.3zM12 11.775"
                        />
                      </svg>
                    ))}
                  </div>

                  {/* Service badge */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Briefcase className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="text-[11px] font-medium text-primary/80 bg-primary/8 border border-primary/15 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                      {testimonial.serviceTitle}
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-muted-foreground font-heading mb-4 text-sm leading-relaxed line-clamp-3 flex-1">
                    "{testimonial.text}"
                  </p>

                  {/* Reviewer + date */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                    <Avatar className="w-10 h-10 border-2 border-primary/10 shrink-0">
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-bold text-sm">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {testimonial.studentId}
                      </div>
                    </div>

                    {testimonial.reviewedAt && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                        <CalendarDays className="w-3 h-3" />
                        {testimonial.reviewedAt}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
