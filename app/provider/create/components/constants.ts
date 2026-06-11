import { z } from "zod";

export const MAX_IMAGES = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];
export const STORAGE_KEY = "create_service_draft";

export const serviceSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000),
  category: z
    .string()
    .min(2, "Please type a valid descriptive service category"),
  pricing_type: z.enum(["fixed", "hourly", "negotiable"]),
  price: z
    .number()
    .min(1, "Base price valuation must be at least GH₵1")
    .max(10000),
  tags: z.array(z.string()).optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
