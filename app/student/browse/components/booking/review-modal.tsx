"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BookingWithDetails } from "./booking-card";

interface ReviewModalProps {
  target: BookingWithDetails | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isSubmitting: boolean;
}

// Custom Star SVG component
const StarIcon = ({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill={filled ? "orange" : "#9ca3af"}
      d="M9.6 15.65L12 13.8l2.4 1.85l-.9-3.05l2.25-1.6h-2.8L12 7.9l-.95 3.1h-2.8l2.25 1.6zM5.825 21l2.325-7.6L2 9h7.6L12 1l2.4 8H22l-6.15 4.4l2.325 7.6L12 16.3zM12 11.775"
    />
  </svg>
);

export function ReviewModal({
  target,
  onClose,
  onSubmit,
  isSubmitting,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Resets on every target change (not just on close), so a new booking
  // never inherits a leftover rating/comment from a previous one.
  useEffect(() => {
    setRating(5);
    setComment("");
  }, [target?.id]);

  const handleSubmit = async () => {
    await onSubmit(rating, comment);
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  type="button"
                  aria-label={`Rate ${r} out of 5 stars`}
                  aria-pressed={r === rating}
                  className="transition-transform hover:scale-110"
                >
                  <StarIcon
                    className={cn(
                      "w-8 h-8 transition-all duration-300",
                      r <= rating ? "scale-110" : "opacity-40 hover:opacity-70",
                    )}
                    filled={r <= rating}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Textarea
              placeholder="Share your experience with this provider..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
