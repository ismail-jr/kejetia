"use client";

interface BookingModalHeaderProps {
  step: number;
  serviceTitle: string;
  onClose: () => void;
}

export function BookingModalHeader({
  step,
  serviceTitle,
  onClose,
}: BookingModalHeaderProps) {
  return (
    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/10">
      <div>
        <h3 className="font-heading font-bold text-lg text-foreground truncate max-w-[340px] sm:max-w-md">
          {step === 4 ? "Complete!" : `Book ${serviceTitle}`}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 4</p>
      </div>
      {step < 4 && (
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
