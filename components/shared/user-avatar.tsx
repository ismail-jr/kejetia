import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/initials";

export interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  /** Shown when `name` is empty, e.g. "S" for student, "PV" for provider. */
  fallbackText?: string;
  /** Classes for the Avatar root (size, border, radius, etc.). */
  className?: string;
  /** Extra classes for the underlying <img>. */
  imageClassName?: string;
  /** Extra classes for the initials fallback (color, size, font-weight). */
  fallbackClassName?: string;
}

// Every place that shows a person's avatar (profiles, chat, admin tables,
// dashboards, reviews, order/booking cards) previously reimplemented the
// same Avatar + AvatarImage + AvatarFallback + inline-initials-derivation
// block. This centralizes that so a change to the fallback rendering
// (initials logic, default styling) only has to happen once.
export function UserAvatar({
  name,
  avatarUrl,
  fallbackText = "U",
  className,
  imageClassName,
  fallbackClassName,
}: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage
        src={avatarUrl || undefined}
        alt={name || "User"}
        className={imageClassName}
      />
      <AvatarFallback className={fallbackClassName}>
        {getInitials(name, fallbackText)}
      </AvatarFallback>
    </Avatar>
  );
}
