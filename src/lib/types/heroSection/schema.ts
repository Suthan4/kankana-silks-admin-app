import z from "zod";

export const SectionTypeEnum = z.enum([
  "FEATURED",
  "NEW_ARRIVALS",
  "BEST_SELLERS",
  "TRENDING",
  "SEASONAL",
  "CATEGORY_SPOTLIGHT",
]);

export const createHomeSectionSchema = z.object({
  type: SectionTypeEnum,
  title: z.string().min(1, "Title is required").max(200),
  subtitle: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().positive().optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export const updateHomeSectionSchema = z.object({
  type: SectionTypeEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().positive().optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export type CreateHomeSectionFormData = z.infer<typeof createHomeSectionSchema>;
export type UpdateHomeSectionFormData = z.infer<typeof updateHomeSectionSchema>;
