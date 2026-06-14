"use client";

import { CreditCard, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Step3ReviewAndPaymentProps {
  selectedDate: Date | undefined;
  providerProfile: any;
  paymentTerm: "before_service" | "after_service";
  servicePrice: number;
}

export function Step3ReviewAndPayment({
  selectedDate,
  providerProfile,
  paymentTerm,
  servicePrice,
}: Step3ReviewAndPaymentProps) {
  const handleCopyDetails = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-5">
      <div className="border border-border/60 rounded-xl p-4 bg-muted/20 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Appointment Schedule Date:</span>
          <span className="font-semibold text-foreground">
            {selectedDate?.toDateString()}
          </span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Target Hours Window:</span>
          <span className="font-semibold text-amber-600">
            {providerProfile?.available_time || "08:00 AM - 05:00 PM"}
          </span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Selected Terms Framework:</span>
          <span className="font-semibold capitalize text-primary">
            {paymentTerm.replace("_", " ")}
          </span>
        </div>
        <div className="border-t border-border/60 my-2 pt-2 flex justify-between text-base font-bold text-foreground">
          <span>Total Due Price:</span>
          <span>GH₵ {servicePrice.toFixed(2)}</span>
        </div>
      </div>

      {/* DYNAMIC OFFLINE PAYMENT INSTRUCTIONS CONTAINER */}
      <div className="border border-amber-500/20 rounded-xl bg-amber-500/5 p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <CreditCard className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Manual Offline Payment Details
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {paymentTerm === "before_service"
                ? "Please complete the mobile money transfer before clicking confirm to secure this booking reservation."
                : "Keep these details handy. You will use them to transfer payment manually once the work is complete."}
            </p>
          </div>
        </div>

        {providerProfile ? (
          <div className="p-3 bg-background border border-border/60 rounded-lg space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Network:</span>
              <span className="font-bold text-amber-600">
                {providerProfile.momo_network}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Account Name:
              </span>
              <span className="font-medium text-foreground">
                {providerProfile.momo_name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Mobile Number:
              </span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                <span>{providerProfile.momo_number}</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyDetails(
                      providerProfile.momo_number,
                      "MoMo Number",
                    )
                  }
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed rounded-lg text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
            Loading provider billing profile records...
          </div>
        )}
      </div>
    </div>
  );
}
