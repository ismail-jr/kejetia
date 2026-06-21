"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  studentId: string;
  avatar: string;
  text: string;
  rating: number;
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "fallback-1",
    name: "Abena Mensah",
    studentId: "PS/ITC/22/0012",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abena",
    text: "I found a great tutor for my algorithms course within hours. The platform is so easy to use!",
    rating: 5,
  },
  {
    id: "fallback-2",
    name: "Kwame Asante",
    studentId: "PS/ENG/22/0015",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kwame",
    text: "I've been offering graphic design services and have already completed 12 orders. UCC Connect changed my campus life.",
    rating: 5,
  },
];

// Header (badge + heading + paragraph) staggers in as one group.
const headerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

// Testimonial cards stagger in as their own group, once in view.
const gridContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data: reviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        if (reviewsError || !reviews || reviews.length === 0) {
          setTestimonials(FALLBACK_TESTIMONIALS);
          setLoading(false);
          return;
        }

        const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
        const { data: reviewers, error: reviewersError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, student_id")
          .in("user_id", reviewerIds);

        if (reviewersError) {
          const fallback = reviews.map((review) => ({
            id: review.id,
            name: "UCC Student",
            studentId: "N/A",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.id}`,
            text: review.comment || "Great service! Highly recommended.",
            rating: review.rating || 5,
          }));
          setTestimonials(fallback);
          setLoading(false);
          return;
        }

        const reviewerMap = new Map();
        reviewers?.forEach((reviewer) => {
          reviewerMap.set(reviewer.user_id, reviewer);
        });

        const transformed = reviews.map((review) => {
          const reviewer = reviewerMap.get(review.reviewer_id);
          const fullName = reviewer?.full_name || "UCC Student";
          const studentId = reviewer?.student_id || "N/A";
          const avatarUrl =
            reviewer?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`;

          return {
            id: review.id,
            name: fullName,
            studentId: studentId,
            avatar: avatarUrl,
            text: review.comment || "Great service! Highly recommended.",
            rating: review.rating || 5,
          };
        });

        setTestimonials(transformed);
      } catch (error) {
        setTestimonials(FALLBACK_TESTIMONIALS);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const displayTestimonials = loading ? FALLBACK_TESTIMONIALS : testimonials;

  return (
    <section className="py-20 bg-muted/30 border-y border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={headerContainer}
        >
          <motion.div variants={itemVariants}>
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 pointer-events-none">
              <Star className="w-3 h-3 mr-1" />
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

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={gridContainer}
        >
          {displayTestimonials.slice(0, 6).map((testimonial) => (
            <motion.div key={testimonial.id} variants={itemVariants}>
              <Card className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300 h-full">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-warning text-warning"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground font-heading mb-4 text-sm leading-relaxed line-clamp-3">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                  <Avatar className="w-10 h-10 border-2 border-primary/10">
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
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.studentId}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
