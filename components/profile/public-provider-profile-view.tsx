import Link from "next/link";
import {
  MapPin,
  Phone,
  CalendarDays,
  Clock,
  ShieldCheck,
  Star,
  Briefcase,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewList } from "@/app/provider/reviews/components/review-list";
import { MessageUserButton } from "@/components/messaging/message-user-button";
import type { ProviderPublicPageData } from "@/lib/data/profiles";
import type { Service } from "@/lib/data/types";
import { handleImageError } from "@/lib/utils/image-fallback";

const PEXELS_FALLBACK =
  "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=400";

function serviceImage(service: Service) {
  return service.images?.[0] || PEXELS_FALLBACK;
}

interface PublicProviderProfileViewProps {
  data: ProviderPublicPageData;
}

export function PublicProviderProfileView({
  data,
}: PublicProviderProfileViewProps) {
  const { profile: provider, services, reviews } = data;
  const isProvider = provider.roles.includes("provider");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <UserAvatar
            name={provider.full_name}
            avatarUrl={provider.avatar_url}
            fallbackText="PV"
            className="w-24 h-24 border-2 border-primary/20 rounded-2xl"
            imageClassName="object-cover"
            fallbackClassName="bg-muted text-muted-foreground text-xl font-bold rounded-2xl"
          />

          <div className="flex-1 space-y-3 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                  {provider.full_name}
                </h1>
                {provider.headline && (
                  <p className="text-sm text-primary font-medium mt-1">
                    {provider.headline}
                  </p>
                )}
                {provider.location && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-muted-foreground text-sm mt-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{provider.location}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                {provider.is_verified && (
                  <Badge
                    variant="secondary"
                    className="rounded-lg gap-1 px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-700 border-none"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </Badge>
                )}
                {isProvider && (
                  <Badge
                    variant="secondary"
                    className="rounded-lg gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary border-none"
                  >
                    <Briefcase className="w-3.5 h-3.5" /> Provider
                  </Badge>
                )}
              </div>
            </div>

            {provider.bio ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {provider.bio}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground/60">
                No bio provided yet.
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">
                  {provider.avg_rating > 0
                    ? provider.avg_rating.toFixed(1)
                    : "New"}
                </span>
                <span className="text-muted-foreground">
                  ({provider.total_reviews} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                <span>{provider.total_bookings} bookings completed</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>{services.length} active services</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
              <MessageUserButton
                targetUserId={provider.user_id}
                label="Send Message"
                className="rounded-xl"
              />
              {provider.phone && (
                <Button asChild variant="outline" className="rounded-xl gap-2">
                  <a href={`tel:${provider.phone}`}>
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Availability */}
        <div className="md:col-span-1 bg-card rounded-2xl border border-border/50 p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="w-4 h-4 text-primary" /> Availability
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">
                Operating Days
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {provider.available_days.length > 0 ? (
                  provider.available_days.map((day) => (
                    <Badge
                      key={day}
                      variant="outline"
                      className="rounded-md bg-muted/40 text-xs font-normal"
                    >
                      {day}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Days not configured
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground block font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Daily Hours
              </span>
              <p className="text-sm font-semibold text-foreground mt-1">
                {provider.available_time || "Not specified"}
              </p>
            </div>

            {provider.momo_network && (
              <div className="pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground block font-medium flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Mobile Money
                </span>
                <p className="text-sm font-semibold text-foreground mt-1 capitalize">
                  {provider.momo_network}
                  {provider.momo_name ? ` · ${provider.momo_name}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Number is shared only after booking.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border/50 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            <Phone className="w-4 h-4 text-primary" /> Contact
          </h3>

          {provider.phone ? (
            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">
                    Phone
                  </p>
                  <p className="text-base font-bold text-foreground tracking-wide truncate">
                    {provider.phone}
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-xl flex-shrink-0">
                <a href={`tel:${provider.phone}`}>Call Now</a>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No phone number on file. Use messaging to reach this provider.
            </p>
          )}
        </div>
      </div>

      {/* Services */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-foreground">
            Services ({services.length})
          </h2>
        </div>

        {services.length === 0 ? (
          <Card className="p-8 text-center rounded-2xl border-dashed">
            <p className="text-muted-foreground text-sm">
              This provider has no approved services listed yet.
            </p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/student/services/${service.id}`}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="relative h-36 overflow-hidden bg-muted">
                  <img
                    src={serviceImage(service)}
                    alt={service.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-2 left-2 capitalize text-xs">
                    {service.category}
                  </Badge>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>
                        {service.avg_rating > 0
                          ? service.avg_rating.toFixed(1)
                          : "New"}
                      </span>
                    </div>
                    <span className="font-bold">
                      GH₵ {Number(service.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-heading text-foreground">
          Reviews ({reviews.length})
        </h2>
        <ReviewList reviews={reviews} loading={false} />
      </section>
    </div>
  );
}
