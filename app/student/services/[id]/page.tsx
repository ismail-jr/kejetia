"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Star,
  Heart,
  ArrowLeft,
  MapPin,
  Calendar,
  MessageSquare,
  Shield,
  CheckCircle,
  Share2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string;
    is_verified: boolean;
    bio: string;
  };
};
type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  profiles?: { full_name: string; avatar_url: string };
};

const PEXELS_FALLBACK =
  "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=800";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchService = async () => {
      const [serviceRes, reviewsRes] = await Promise.all([
        supabase
          .from("services")
          .select("*, profiles(id, full_name, avatar_url, is_verified, bio)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("*, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)")
          .eq("service_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (serviceRes.data) setService(serviceRes.data as Service);
      if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
      if (user) {
        const { data: saved } = await supabase
          .from("saved_services")
          .select("id")
          .eq("student_id", user.id)
          .eq("service_id", id)
          .maybeSingle();
        setIsSaved(!!saved);
      }
      setLoading(false);
    };
    fetchService();
  }, [id, user]);

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (isSaved) {
      await supabase
        .from("saved_services")
        .delete()
        .eq("student_id", user.id)
        .eq("service_id", id);
      setIsSaved(false);
      toast.success("Removed from saved");
    } else {
      await supabase
        .from("saved_services")
        .insert({ student_id: user.id, service_id: id });
      setIsSaved(true);
      toast.success("Service saved!");
    }
  };

  const handleBook = async () => {
    if (!user || !profile || !service) return;
    setBooking(true);
    try {
      const { error } = await (supabase.from("bookings") as any).insert({
        service_id: service.id,
        student_id: user.id,
        provider_id: service.provider_id,
        booking_date: bookingDate || null,
        notes: bookingNotes,
        amount: service.price,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Booking request sent!");
      setShowBooking(false);
      router.push("/student/bookings");
    } catch {
      toast.error("Failed to submit booking");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-72 rounded-2xl animate-shimmer" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 w-3/4 rounded animate-shimmer" />
            <div className="h-4 w-1/2 rounded animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Service not found</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Go back
        </Button>
      </div>
    );
  }

  const images = service.images?.length ? service.images : [PEXELS_FALLBACK];
  const providerInitials =
    service.profiles?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "U";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden h-72 bg-muted">
              <img
                src={images[selectedImage]}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                      selectedImage === i
                        ? "border-primary"
                        : "border-transparent",
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service info */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="capitalize">
                {service.category}
              </Badge>
              {service.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {service.title}
            </h1>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">
                  {service.avg_rating > 0
                    ? service.avg_rating.toFixed(1)
                    : "New"}
                </span>
                {service.total_reviews > 0 && (
                  <span>({service.total_reviews} reviews)</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{service.total_bookings} completed</span>
              </div>
            </div>

            <h2 className="font-semibold text-foreground mb-2">
              About this service
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {service.description}
            </p>
          </div>

          {/* Reviews */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-5">
              Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              <div className="space-y-5">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-3">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={review.profiles?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {review.profiles?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {review.profiles?.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3 h-3",
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground",
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5 sticky top-20">
            <div className="text-3xl font-bold text-foreground mb-1">
              GH₵ {Number(service.price).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mb-5">Starting price</p>

            <Button
              className="w-full h-11 rounded-xl shadow-primary mb-3"
              onClick={() => setShowBooking(true)}
              disabled={!user || service.provider_id === user?.id}
            >
              {!user
                ? "Sign in to Book"
                : service.provider_id === user.id
                  ? "Your Service"
                  : "Book Now"}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={handleSave}
              >
                <Heart
                  className={cn(
                    "w-4 h-4 mr-2",
                    isSaved ? "fill-red-500 text-red-500" : "",
                  )}
                />
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Provider card */}
            <div className="mt-5 pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                About the Provider
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={service.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary text-white text-sm font-bold">
                    {providerInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm flex items-center gap-1">
                    {service.profiles?.full_name}
                    {service.profiles?.is_verified && (
                      <Shield className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    UCC Student
                  </div>
                </div>
              </div>
              {service.profiles?.bio && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {service.profiles.bio}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 rounded-xl"
                onClick={() =>
                  router.push(`/student/messages?with=${service.provider_id}`)
                }
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Provider
              </Button>
            </div>

            {/* Guarantees */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {[
                { icon: Shield, text: "UCC verified student" },
                { icon: CheckCircle, text: "Secure booking process" },
                { icon: Star, text: "Review after completion" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Book: {service.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center p-3 bg-muted rounded-xl text-sm">
              <span className="text-muted-foreground">Service fee</span>
              <span className="font-bold text-foreground">
                GH₵ {Number(service.price).toFixed(2)}
              </span>
            </div>
            <div className="space-y-2">
              <Label>Preferred Date (optional)</Label>
              <Input
                type="datetime-local"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="rounded-xl h-11"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes for Provider (optional)</Label>
              <Textarea
                placeholder="Any specific requirements or questions..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBooking(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              disabled={booking}
              className="shadow-primary"
            >
              {booking ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
