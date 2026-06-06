"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField } from "./form-field";
import { Briefcase, Tag, Clock, Globe } from "lucide-react";

interface ProviderFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export function ProviderFields({ register, errors }: ProviderFieldsProps) {
  return (
    <Card className="rounded-2xl border-amber-200/60 dark:border-amber-800/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-amber-500" />
          Service Details
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[10px] ml-1">
            Provider only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            id="service_category"
            label="Service Category"
            icon={<Tag className="w-4 h-4 text-muted-foreground" />}
          >
            <Input
              id="service_category"
              placeholder="e.g. Graphic Design, Tutoring"
              className="pl-10 h-11 rounded-xl"
              {...register("service_category")}
            />
          </FormField>

          <FormField
            id="service_rate"
            label="Starting Rate"
            icon={
              <span className="text-xs font-bold text-muted-foreground pl-0.5">
                ₵
              </span>
            }
          >
            <Input
              id="service_rate"
              placeholder="e.g. 50 / hour or From GHS 30"
              className="pl-10 h-11 rounded-xl"
              {...register("service_rate")}
            />
          </FormField>
        </div>

        <FormField
          id="availability"
          label="Availability"
          icon={<Clock className="w-4 h-4 text-muted-foreground" />}
        >
          <Input
            id="availability"
            placeholder="e.g. Weekdays after 3pm, Weekends"
            className="pl-10 h-11 rounded-xl"
            {...register("availability")}
          />
        </FormField>

        <FormField
          id="portfolio_url"
          label="Portfolio / Website URL"
          error={errors.portfolio_url?.message as string}
          icon={<Globe className="w-4 h-4 text-muted-foreground" />}
        >
          <Input
            id="portfolio_url"
            placeholder="https://yourportfolio.com"
            className="pl-10 h-11 rounded-xl"
            {...register("portfolio_url")}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
