"use client";

import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Clock, Loader2 } from "lucide-react";

interface Step1CalendarSelectionProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  providerProfile: any;
  isDateDisabled: (date: Date) => boolean;
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

export function Step1CalendarSelection({
  selectedDate,
  setSelectedDate,
  providerProfile,
  isDateDisabled,
}: Step1CalendarSelectionProps) {
  if (!providerProfile) {
    return (
      <div className="text-center py-12 border border-dashed rounded-xl text-xs text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
        Loading provider operational timeline profiles...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Select Appointment Day
        </Label>
        <p className="text-xs text-muted-foreground">
          Review the provider's weekly structural baseline schedule on the left
          and select an explicit active calendar date on the right.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {/* LEFT COLUMN: ACTIVE ROUTINE WORKDAYS OVERVIEW */}
        <div className="md:col-span-2 space-y-3 bg-muted/20 border border-border/60 rounded-xl p-4 h-full flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase block">
              Operating Schedule
            </span>
            <div className="space-y-1.5">
              {daysMap.map((day) => {
                const isActive = providerProfile.available_days?.includes(day);
                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-500/5 text-emerald-700 border-emerald-500/20 shadow-sm"
                        : "bg-background/40 text-muted-foreground/60 border-border/40 line-through"
                    }`}
                  >
                    <span>{day}</span>
                    {isActive ? (
                      <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wide">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-normal text-muted-foreground/40">
                        Off
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Working Window Hours Element Footer */}
          <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-muted-foreground mt-2">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-semibold block text-foreground">
                Active Hours Window:
              </span>
              <span className="text-muted-foreground/90 font-mono">
                {providerProfile.available_time || "08:00 AM - 05:00 PM"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CALENDAR DATE SELECTOR PICKER */}
        <div className="md:col-span-3 border border-border/80 rounded-xl p-3 flex justify-center bg-background">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            className="rounded-xl p-0 w-full"
          />
        </div>
      </div>
    </div>
  );
}
