"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getProviderPublicProfile, createBooking } from "@/lib/data";
import { isOwnService } from "@/lib/utils/booking";
import { toast } from "sonner";
import { BookingModalHeader } from "./modal-header";
import { Step1CalendarSelection } from "./step1-calendar";
import { Step2PaymentTerms } from "./step2-payment";
import { Step3ReviewAndPayment } from "./step3_review-payment";
import { Step4Success } from "./step4-success";
import { BookingModalFooter } from "./modal-footer";

interface BookingModalProps {
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  servicePrice: number;
  isOpen: boolean;
  onClose: () => void;
}

const daysMap = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function BookingModal({
  serviceId,
  serviceTitle,
  providerId,
  servicePrice,
  isOpen,
  onClose,
}: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [providerProfile, setProviderProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [notes, setNotes] = useState("");
  const [paymentTerm, setPaymentTerm] = useState<
    "before_service" | "after_service"
  >("after_service");

  // Fetch the service provider's profile
  useEffect(() => {
    if (isOpen && providerId) {
      const fetchProviderData = async () => {
        // Identity (full_name/phone) + provider extension (momo/availability)
        // merged into one shape by the data layer.
        try {
          const data = await getProviderPublicProfile(providerId);
          setProviderProfile(data);
        } catch (error) {
          console.error("Profile fetch error:", error);
          toast.error("Failed to fetch provider availability metadata.");
        }
      };
      fetchProviderData();
    }
  }, [isOpen, providerId]);

  // Helper function to check if a calendar date is disabled
  const isDateDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    if (!providerProfile?.available_days) return false;
    const targetDayString = daysMap[date.getDay()];
    return !providerProfile.available_days.includes(targetDayString);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to log your booking order request.");
        return;
      }

      if (isOwnService(user.id, providerId)) {
        toast.error("You cannot book your own service.");
        return;
      }

      await createBooking({
        service_id: serviceId,
        client_id: user.id,
        provider_id: providerId,
        status: "pending",
        appointment_date: selectedDate?.toISOString().split("T")[0]!,
        appointment_time:
          providerProfile?.available_time || "08:00 AM - 05:00 PM",
        payment_term: paymentTerm,
        notes: notes.trim() || null,
        base_amount: servicePrice,
        total_amount: servicePrice,
        payment_status: "unpaid",
      });

      setStep(4);
      toast.success("Booking logged successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to commit layout reservation rows.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);
  const handleClose = () => {
    setStep(1);
    setSelectedDate(new Date());
    setNotes("");
    setPaymentTerm("after_service");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60  p-4">
      <div className="bg-background border border-border w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <BookingModalHeader
          step={step}
          serviceTitle={serviceTitle}
          onClose={handleClose}
        />

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === 1 && (
            <Step1CalendarSelection
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              providerProfile={providerProfile}
              isDateDisabled={isDateDisabled}
            />
          )}

          {step === 2 && (
            <Step2PaymentTerms
              paymentTerm={paymentTerm}
              setPaymentTerm={setPaymentTerm}
              notes={notes}
              setNotes={setNotes}
            />
          )}

          {step === 3 && (
            <Step3ReviewAndPayment
              selectedDate={selectedDate}
              providerProfile={providerProfile}
              paymentTerm={paymentTerm}
              servicePrice={servicePrice}
            />
          )}

          {step === 4 && (
            <Step4Success
              providerProfile={providerProfile}
              onClose={handleClose}
            />
          )}
        </div>

        <BookingModalFooter
          step={step}
          selectedDate={selectedDate}
          providerProfile={providerProfile}
          submitting={submitting}
          onBack={handleBack}
          onContinue={handleContinue}
          onSubmit={handleFinalSubmit}
        />
      </div>
    </div>
  );
}
