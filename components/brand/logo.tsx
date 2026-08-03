import Image from "next/image";
import { cn } from "@/lib/utils";

// Single source of truth for the Kejetia logo asset. Every place that
// shows the logo (navbar, footer, sidebars, auth screens, favicon
// metadata) imports from here instead of hardcoding the file path —
// swapping the logo image again is then a one-file change, not a
// repo-wide find-and-replace.
export const LOGO_SRC = "/images/logo.png";
export const LOGO_ALT = "Kejetia Logo";

export interface LogoProps {
  /** Square size in pixels applied to both the wrapper and the image. Omit to size purely via `wrapperClassName` (e.g. responsive `w-10 sm:w-11` classes). */
  size?: number;
  /** Classes for the sizing/background wrapper (e.g. "rounded-xl bg-primary p-2"). */
  wrapperClassName?: string;
  /** Extra classes appended to the image itself, after "object-contain". */
  className?: string;
  priority?: boolean;
  alt?: string;
}

export function Logo({
  size,
  wrapperClassName,
  className,
  priority,
  alt = LOGO_ALT,
}: LogoProps) {
  return (
    <div
      className={cn("relative", wrapperClassName)}
      style={size ? { width: size, height: size } : undefined}
    >
      <Image
        src={LOGO_SRC}
        alt={alt}
        fill
        priority={priority}
        sizes={size ? `${size}px` : undefined}
        className={cn("object-contain", className)}
      />
    </div>
  );
}
