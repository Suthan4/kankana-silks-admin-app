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

export const MediaTypeEnum = z.enum(["IMAGE", "VIDEO"]);

export const CTAStyleEnum = z.enum(["PRIMARY", "SECONDARY", "OUTLINE", "TEXT"]);

// Section Media Schema
export const SectionMediaSchema = z.object({
  type: MediaTypeEnum,
  url: z.string().url("Invalid media URL"),
  thumbnailUrl: z.string().url().optional(),
  altText: z.string().optional(),
  title: z.string().optional(),
  order: z.coerce.number().int().default(0),
  overlayTitle: z.string().optional(),
  overlaySubtitle: z.string().optional(),
  overlayPosition: z
    .enum(["center", "left", "right", "top", "bottom"])
    .default("center"),
});

// Section CTA Schema
export const SectionCTASchema = z.object({
  text: z.string().min(1, "Button text is required").max(50),
  url: z
    .string()
    .url("Invalid URL")
    .or(z.string().regex(/^\//, "Must start with /")),
  style: CTAStyleEnum.default("PRIMARY"),
  icon: z.string().optional(),
  order: z.coerce.number().int().default(0),
  openNewTab: z.boolean().default(false),
});

// Create HomeSection Schema
export const createHomeSectionSchema = z
  .object({
    type: SectionTypeEnum,
    title: z.string().min(1, "Title is required").max(200),
    subtitle: z.string().max(500).optional(),
    description: z.string().max(2000).optional(),
    customTypeName: z.string().min(1).max(100).optional(),

    // Layout & Styling
    backgroundColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
      .optional(),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
      .optional(),
    layout: z.enum(["grid", "carousel", "list", "banner", "aesthetic-fullscreen"]).default("grid"),
    columns: z.coerce.number().int().min(1).max(12).default(4),

    // Display Settings
    isActive: z.boolean().optional(),
    order: z.coerce.number().int().optional(),
    limit: z.coerce.number().int().positive().optional(),
    showTitle: z.boolean().default(true),
    showSubtitle: z.boolean().default(true),

    // Relations
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    media: z.array(SectionMediaSchema).optional(),
    ctaButtons: z.array(SectionCTASchema).optional(),
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
  )
  .refine(
    (data) => {
      // If type is HERO_SLIDER, at least one media is required
      if (data.type === "HERO_SLIDER") {
        return data.media && data.media.length > 0;
      }
      return true;
    },
    {
      message: "At least one media item is required for Hero Slider",
      path: ["media"],
    }
  );

// Update HomeSection Schema
export const updateHomeSectionSchema = z
  .object({
    type: SectionTypeEnum.optional(),
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(500).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    customTypeName: z.string().min(1).max(100).optional().nullable(),

    // Layout & Styling
    backgroundColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .nullable(),
    textColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .nullable(),
    layout: z.enum(["grid", "carousel", "list", "banner","aesthetic-fullscreen"]).optional(),
    columns: z.coerce.number().int().min(1).max(12).optional(),

    // Display Settings
    isActive: z.boolean().optional(),
    order: z.coerce.number().int().optional(),
    limit: z.coerce.number().int().positive().optional(),
    showTitle: z.boolean().optional(),
    showSubtitle: z.boolean().optional(),

    // Relations
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    media: z.array(SectionMediaSchema).optional(),
    ctaButtons: z.array(SectionCTASchema).optional(),
  })
  .refine(
    (data) => {
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
export type SectionMediaFormData = z.infer<typeof SectionMediaSchema>;
export type SectionCTAFormData = z.infer<typeof SectionCTASchema>;
