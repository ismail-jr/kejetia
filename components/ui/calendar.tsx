"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center px-8", // Updated from caption
        caption_label: "text-sm font-semibold text-foreground",
        nav: "space-x-1 flex items-center",
        button_previous:
          "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-muted rounded-md flex items-center justify-center transition-colors z-10 cursor-pointer", // Standardized mapping
        button_next:
          "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-muted rounded-md flex items-center justify-center transition-colors z-10 cursor-pointer", // Standardized mapping
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex w-full justify-between mt-2",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full justify-between mt-2",
        day: "h-9 w-9 p-0 font-normal rounded-lg hover:bg-muted transition-colors flex items-center justify-center text-foreground cursor-pointer text-sm font-medium",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold", // Updated key name
        today: "bg-accent text-accent-foreground font-bold", // Updated key name
        outside: "text-muted-foreground/30 opacity-50", // Updated key name
        disabled:
          "text-muted-foreground/20 opacity-30 line-through cursor-not-allowed", // Updated key name
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        // Combines both IconLeft and IconRight into orientation logic
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
