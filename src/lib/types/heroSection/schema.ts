import z from "zod";

export const SectionTypeEnum = z.enum([
  "HERO_SLIDER",
  "NEW_ARRIVALS",
  "FEATURED",
  "COLLECTIONS",
  "CATEGORIES",
  "BEST_SELLERS",
  "TRENDING",
  "SEASONAL",
  "CATEGORY_SPOTLIGHT",
  "CUSTOM",
]);

export const createHomeSectionSchema = z
  .object({
    type: SectionTypeEnum,
    title: z.string().min(1, "Title is required").max(200),
    subtitle: z.string().max(500).optional(),
    customTypeName: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
    order: z.coerce.number().int().optional(),
    limit: z.coerce.number().int().positive().optional(),
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // If type is CUSTOM, customTypeName is required
      if (data.type === "CUSTOM") {
        return !!data.customTypeName && data.customTypeName.length > 0;
      }
      return true;
    },
    {
      message: "Custom type name is required when type is CUSTOM",
      path: ["customTypeName"],
    }
  );

export const updateHomeSectionSchema = z
  .object({
    type: SectionTypeEnum.optional(),
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(500).optional().nullable(),
    customTypeName: z.string().min(1).max(100).optional().nullable(),
    isActive: z.boolean().optional(),
    order: z.coerce.number().int().optional(),
    limit: z.coerce.number().int().positive().optional(),
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // If type is CUSTOM, customTypeName is required
      if (data.type === "CUSTOM") {
        return !!data.customTypeName && data.customTypeName.length > 0;
      }
      return true;
    },
    {
      message: "Custom type name is required when type is CUSTOM",
      path: ["customTypeName"],
    }
  );

export type CreateHomeSectionFormData = z.infer<typeof createHomeSectionSchema>;
export type UpdateHomeSectionFormData = z.infer<typeof updateHomeSectionSchema>;
