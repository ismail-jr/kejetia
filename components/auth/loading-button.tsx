import React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function LoadingButton({
  children,
  isLoading,
  loadingText,
  icon,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      className={cn(
        "w-full h-11 rounded-xl font-semibold shadow-lg",
        className,
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText || "Processing request..."}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {children}
          {icon}
        </span>
      )}
    </Button>
  );
}
