import z from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDesc: z.string().max(160).optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDesc: z.string().max(160).optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
