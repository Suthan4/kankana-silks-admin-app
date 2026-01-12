import z from "zod";

// Stock Schema - Used for both simple products and variants
const StockSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.coerce.number().int().min(0, "Quantity must be positive"),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(10), // Defaults to 10 if not provided
});

const SpecificationSchema = z.object({
  key: z.string().min(1, "Specification key is required"),
  value: z.string().min(1, "Specification value is required"),
});

// UPDATED: MediaSchema (replaces ImageSchema)
const MediaSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]).optional().default("IMAGE"),
  url: z.string().url("Invalid media URL"),
  key: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  altText: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  order: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// 🆕 UPDATED: VariantSchema - stock is now REQUIRED
const VariantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  fabric: z.string().optional(),
  price: z.coerce.number().positive("Variant price must be positive"),
  stock: StockSchema, // 🆕 Now REQUIRED (was optional)
});

export const createProductSchema = z
  .object({
    // Basic Information
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    categoryId: z.string().min(1, "Category is required"),
    basePrice: z.coerce.number().positive("Base price must be positive"),
    sellingPrice: z.coerce.number().positive("Selling price must be positive"),
    isActive: z.boolean().optional().default(true),
    hsnCode: z.string().optional(),

    // Artisan Information
    artisanName: z.string().optional(),
    artisanAbout: z.string().optional(),
    artisanLocation: z.string().optional(),

    // 🆕 Shipping Dimensions (Required for Shiprocket)
    weight: z.coerce
      .number()
      .positive("Weight must be positive")
      .max(50, "Weight cannot exceed 50kg"),
    length: z.coerce
      .number()
      .positive("Length must be positive")
      .max(200, "Length cannot exceed 200cm"),
    breadth: z.coerce
      .number()
      .positive("Breadth must be positive")
      .max(200, "Breadth cannot exceed 200cm"),
    height: z.coerce
      .number()
      .positive("Height must be positive")
      .max(200, "Height cannot exceed 200cm"),
    // Note: volumetricWeight is auto-calculated by backend

    // SEO
    metaTitle: z.string().optional(),
    metaDesc: z.string().optional(),
    schemaMarkup: z.string().optional(),

    // Product Details
    specifications: z.array(SpecificationSchema).optional(),
    media: z.array(MediaSchema).optional(), // UPDATED: Changed from images to media

    // Stock Configuration (Simple Product OR Variants)
    variants: z.array(VariantSchema).optional(),
    stock: StockSchema.optional(),
  })
  .refine(
    (data) => {
      // Either variants OR stock must be provided, but not both
      const hasVariants = data.variants && data.variants.length > 0;
      const hasStock = !!data.stock;

      if (hasVariants && hasStock) return false; // Cannot have both
      if (!hasVariants && !hasStock) return false; // Must have one

      // If has variants, each variant MUST have stock (now enforced by schema)
      // This check is redundant but kept for clarity
      if (hasVariants) {
        return data.variants!.every((v) => v.stock !== undefined);
      }

      return true;
    },
    {
      message:
        "Product must have either stock (simple product) or variants with stock (variable product), but not both",
    }
  );

export const updateProductSchema = z.object({
  // Basic Information
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  basePrice: z.coerce.number().positive().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  isActive: z.boolean().optional(),
  hsnCode: z.string().optional(),

  // Artisan Information
  artisanName: z.string().optional(),
  artisanAbout: z.string().optional(),
  artisanLocation: z.string().optional(),

  // 🆕 Shipping Dimensions (Optional in update)
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),
  // volumetricWeight is auto-calculated

  // SEO
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  schemaMarkup: z.string().optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
