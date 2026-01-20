import z from "zod";

const parentIdSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === "" || val === "null" || val === "undefined") return null;
    return val;
  });

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  parentId: parentIdSchema.optional(),
  metaTitle: z.string().max(60).optional(),
  metaDesc: z.string().max(160).optional(),
  // image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  image: z
    .string()
    .refine(
      (value) => value.startsWith("data:image/") || value.startsWith("http"),
      "Only JPG, PNG, WEBP images are allowed"
    )
    .optional(),
  isActive: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
    // 🆕 Video features
  hasVideoConsultation: z.boolean().optional().default(false),
  videoPurchasingEnabled: z.boolean().optional().default(false),
  videoConsultationNote: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: parentIdSchema.optional(),
  metaTitle: z.string().max(60).optional(),
  metaDesc: z.string().max(160).optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
   // 🆕 Video features
  hasVideoConsultation: z.boolean().optional(),
  videoPurchasingEnabled: z.boolean().optional(),
  videoConsultationNote: z.string().optional(),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
