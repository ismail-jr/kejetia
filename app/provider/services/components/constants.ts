import { Clock, CheckCircle, XCircle, Archive } from "lucide-react";

export const CATEGORIES = [
  { value: "tutoring", label: "Tutoring" },
  { value: "design", label: "Design" },
  { value: "programming", label: "Programming" },
  { value: "photography", label: "Photography" },
  { value: "writing", label: "Writing" },
  { value: "music", label: "Music" },
  { value: "fitness", label: "Fitness" },
  { value: "cooking", label: "Cooking" },
  { value: "other", label: "Other" },
];

export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    style: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending Review",
    style:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    style:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    style: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
  archived: {
    label: "Archived",
    style: "bg-muted text-muted-foreground",
    icon: Archive,
  },
};

export const PEXELS_FALLBACK =
  "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=400";
