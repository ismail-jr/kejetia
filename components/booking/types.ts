export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingFormData {
  selectedDate: Date | undefined;
  selectedTimeSlot: string | null;
  notes: string;
  payment_term: "before_service" | "after_service";
}
