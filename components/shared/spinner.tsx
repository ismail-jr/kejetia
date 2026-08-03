import { cn } from "@/lib/utils";

export interface SpinnerProps {
  /** Size/color/etc. overrides, merged after the default ring styles. */
  className?: string;
}

// The bare spinning ring used for loading states throughout the app.
// Centralized so tweaking the loading indicator's look is a one-file
// change instead of editing every layout/page that renders one.
export function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin",
        className,
      )}
    />
  );
}

export interface PageSpinnerProps extends SpinnerProps {
  /** Classes for the centering container, merged after the full-height default. */
  containerClassName?: string;
}

// A Spinner centered in a full-height container — the loading state used
// by every top-level role layout (student/provider/admin) and
// Suspense/page-level fallbacks.
export function PageSpinner({ className, containerClassName }: PageSpinnerProps) {
  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center",
        containerClassName,
      )}
    >
      <Spinner className={className} />
    </div>
  );
}
