import { z } from "zod";

export const createBannerSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  url: z.string().url("Invalid URL").optional(),
  key: z.string().optional(),
  thumbnailUrl: z
    .string()
    .url("Invalid thumbnail URL")
    .optional()
    .or(z.literal("")),
  link: z.string().url("Invalid link URL").optional().or(z.literal("")),
  text: z
    .string()
    .max(500, "Text must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type CreateBannerFormData = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  type: z.enum(["IMAGE", "VIDEO"]).optional(),
  url: z.string().url("Invalid URL").optional(),
  key: z.string().optional(),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional().nullable(),
  link: z.string().url("Invalid link URL").optional().nullable(),
  text: z
    .string()
    .max(500, "Text must be less than 500 characters")
    .optional()
    .nullable(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdateBannerFormData = z.infer<typeof updateBannerSchema>;
