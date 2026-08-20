import { z } from "zod";

const optionalIdSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.string().min(1).optional());

const optionalTextSchema = z.preprocess(
  (value) => (value === null || value === undefined ? "" : value),
  z.string().optional(),
);

const imageSchema = z
  .string()
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("data:image/") ||
      value.startsWith("http"),
    {
      message: "Only JPG, PNG, WEBP images are allowed",
    },
  )
  .optional();

const categoryFields = {
  name: z.string().min(1, "Name is required").max(100),
  description: optionalTextSchema,
  metaTitle: z
    .string()
    .max(70, "Meta title must be less than 70 characters")
    .optional(),
  metaDesc: z
    .string()
    .max(160, "Meta description must be less than 160 characters")
    .optional(),
  image: imageSchema,
  isActive: z.boolean().optional().default(true),
  isRoot: z.boolean().optional().default(false),
  order: z.coerce.number().int("Order must be a whole number").default(0),
  hasVideoConsultation: z.boolean().optional().default(false),
  videoPurchasingEnabled: z.boolean().optional().default(false),
  videoConsultationNote: optionalTextSchema,
};

export const createCategorySchema = z.object({
  ...categoryFields,
  parentId: optionalIdSchema,
  /** Only relevant when parentId is set — show subcategories under this parent. */
  includeChildren: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: categoryFields.name.optional(),
  description: categoryFields.description,
  isRoot: z.boolean().optional(),
  metaTitle: categoryFields.metaTitle,
  metaDesc: categoryFields.metaDesc,
  image: categoryFields.image,
  isActive: z.boolean().optional(),
  order: z.coerce.number().int("Order must be a whole number").optional(),
  hasVideoConsultation: z.boolean().optional(),
  videoPurchasingEnabled: z.boolean().optional(),
  videoConsultationNote: categoryFields.videoConsultationNote,
});

export const linkCategorySchema = z
  .object({
    parentId: z.string().min(1, "Select a parent category"),
    childId: z.string().min(1, "Select a category to link"),
    order: z.coerce.number().int("Order must be a whole number").default(0),
    /** Show the linked category's own subcategories under this parent. */
    includeChildren: z.boolean().optional().default(true),
  })
  .refine((data) => data.parentId !== data.childId, {
    message: "A category cannot be linked under itself",
    path: ["childId"],
  });

export const updatePlacementSchema = z
  .object({
    order: z.coerce.number().int("Order must be a whole number").optional(),
    includeChildren: z.boolean().optional(),
  })
  .refine(
    (data) => data.order !== undefined || data.includeChildren !== undefined,
    { message: "Provide at least one field to update" },
  );

export type CreateCategoryFormInput = z.input<typeof createCategorySchema>;
export type CreateCategoryFormData = z.output<typeof createCategorySchema>;

export type UpdateCategoryFormInput = z.input<typeof updateCategorySchema>;
export type UpdateCategoryFormData = z.output<typeof updateCategorySchema>;

export type LinkCategoryFormInput = z.input<typeof linkCategorySchema>;
export type LinkCategoryFormData = z.output<typeof linkCategorySchema>;

export type UpdatePlacementFormInput = z.input<typeof updatePlacementSchema>;
export type UpdatePlacementFormData = z.output<typeof updatePlacementSchema>;