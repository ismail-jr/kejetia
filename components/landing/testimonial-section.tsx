"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from "lucide-react";

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
          {displayTestimonials.slice(0, 6).map((testimonial) => (
            <Card
              key={testimonial.id}
              className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
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
  );
}
