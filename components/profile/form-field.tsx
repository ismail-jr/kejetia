"use client";

import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  required,
  error,
  hint,
  icon,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {icon ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
            {icon}
          </span>
          {children}
        </div>
      ) : (
        children
      )}
      {error && (
        <p className="text-destructive text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}
