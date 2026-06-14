"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BookingModalFooterProps {
  step: number;
  selectedDate: Date | undefined;
  providerProfile: any;
  submitting: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSubmit: () => void;
}

export function BookingModalFooter({
  step,
  selectedDate,
  providerProfile,
  submitting,
  onBack,
  onContinue,
  onSubmit,
}: BookingModalFooterProps) {
  if (step === 4) return null;

  return (
    <div className="p-4 border-t border-border flex justify-between bg-muted/10">
      <Button
        type="button"
        variant="ghost"
        disabled={step === 1 || submitting}
        onClick={onBack}
        className="rounded-xl text-xs font-medium"
      >
        Back
      </Button>

      {step < 3 ? (
        <Button
          type="button"
          disabled={step === 1 && !selectedDate}
          onClick={onContinue}
          className="rounded-xl text-xs font-medium px-5"
        >
          Continue
        </Button>
      ) : (
        <Button
          type="button"
          disabled={submitting || !providerProfile}
          onClick={onSubmit}
          className="rounded-xl text-xs font-bold px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Committing
              Booking...
            </>
          ) : (
            "Confirm & Request Booking"
          )}
        </Button>
      )}
    </div>
  );
}
