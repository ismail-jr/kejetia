"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Step2PaymentTermsProps {
  paymentTerm: "before_service" | "after_service";
  setPaymentTerm: (term: "before_service" | "after_service") => void;
  notes: string;
  setNotes: (notes: string) => void;
}

export function Step2PaymentTerms({
  paymentTerm,
  setPaymentTerm,
  notes,
  setNotes,
}: Step2PaymentTermsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3 bg-muted/20 border border-border/60 p-4 rounded-xl">
        <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
          How would you prefer to pay the provider?
        </Label>
        <RadioGroup
          value={paymentTerm}
          onValueChange={(val: any) => setPaymentTerm(val)}
          className="grid sm:grid-cols-2 gap-3 pt-1"
        >
          <label
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              paymentTerm === "after_service"
                ? "border-primary bg-primary/5 font-semibold"
                : "border-border/60 bg-background"
            }`}
          >
            <RadioGroupItem
              value="after_service"
              id="after"
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="text-sm block text-foreground">
                Pay After Service (Work Done)
              </span>
              <span className="text-xs text-muted-foreground font-normal block">
                Pay cash or transfer via MoMo only after your delivery/laundry
                is finished.
              </span>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              paymentTerm === "before_service"
                ? "border-primary bg-primary/5 font-semibold"
                : "border-border/60 bg-background"
            }`}
          >
            <RadioGroupItem
              value="before_service"
              id="before"
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="text-sm block text-foreground">
                Pay Upfront (Before Work)
              </span>
              <span className="text-xs text-muted-foreground font-normal block">
                Transfer payment details immediately to hold your premium slot
                reservation.
              </span>
            </div>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="modal-notes"
          className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
        >
          Add Instructions or Notes for the Provider
        </Label>
        <Textarea
          id="modal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g., Please pick up the items near Valco Hall senior common room or let's meet up right after my 10 AM lectures..."
          rows={4}
          className="rounded-xl bg-muted/10 resize-none"
        />
      </div>
    </div>
  );
}
