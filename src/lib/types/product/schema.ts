import z from "zod";

// Stock Schema - Used for both simple products and variants
const StockSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.coerce.number().int().min(0, "Quantity must be positive"),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(10),
});

const SpecificationSchema = z.object({
  key: z.string().min(1, "Specification key is required"),
  value: z.string().min(1, "Specification value is required"),
});

// Media Schema for product-level media
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

// 🆕 Variant Media Schema
const VariantMediaSchema = z.object({
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

// 🆕 ENHANCED: Variant Schema with media, pricing, dimensions, and attributes
const VariantSchema = z.object({
  // Dynamic attributes (flexible key-value pairs)
  attributes: z.record(z.string(),z.string()).optional(),

  // Legacy fields (backward compatibility)
  size: z.string().optional(),
  color: z.string().optional(),
  fabric: z.string().optional(),

  // Pricing (optional - falls back to product pricing)
  basePrice: z.coerce
    .number()
    .positive("Base price must be positive")
    .optional(),
  sellingPrice: z.coerce
    .number()
    .positive("Selling price must be positive")
    .optional(),
  price: z.coerce.number().positive("Variant price must be positive"), // Legacy field

  // Shipping dimensions (optional - falls back to product dimensions)
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),

  // 🆕 Variant-specific media
  media: z.array(VariantMediaSchema).optional(),

  // Stock (required)
  stock: StockSchema,
});

// 🆕 Dynamic Attribute Field Schema (for UI)
const AttributeFieldSchema = z.object({
  key: z.string().min(1, "Attribute name is required"),
  value: z.string().min(1, "Attribute value is required"),
});

export const createProductSchema = z
  .object({
    // Basic Information
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    categoryId: z.string().min(1, "Category is required"),
    basePrice: z.coerce.number().positive("Base price must be positive"),
    sellingPrice: z.coerce.number().positive("Selling price must be positive"),
    sku: z.string().optional(), // 🆕 Optional - auto-generated if not provided
    isActive: z.boolean().optional().default(true),
    hsnCode: z.string().optional(),

    // Artisan Information
    artisanName: z.string().optional(),
    artisanAbout: z.string().optional(),
    artisanLocation: z.string().optional(),

    // Shipping Dimensions (Required)
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

    // SEO
    metaTitle: z.string().optional(),
    metaDesc: z.string().optional(),
    schemaMarkup: z.string().optional(),

    // Product Details
    specifications: z.array(SpecificationSchema).optional(),
    media: z.array(MediaSchema).optional(),

    // Stock Configuration
    variants: z.array(VariantSchema).optional(),
    stock: StockSchema.optional(),
  })
  .refine(
    (data) => {
      const hasVariants = data.variants && data.variants.length > 0;
      const hasStock = !!data.stock;

      if (hasVariants && hasStock) return false; // Cannot have both
      if (!hasVariants && !hasStock) return false; // Must have one

      // Each variant must have stock
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
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  basePrice: z.coerce.number().positive().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  sku: z.string().optional(), // 🆕 Allow SKU updates
  isActive: z.boolean().optional(),
  hsnCode: z.string().optional(),

  // Artisan Information
  artisanName: z.string().optional(),
  artisanAbout: z.string().optional(),
  artisanLocation: z.string().optional(),

  // Shipping Dimensions
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),

  // SEO
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  schemaMarkup: z.string().optional(),
});

// 🆕 Add Variant Schema (for adding variants to existing products)
export const addVariantSchema = z.object({
  attributes: z.record(z.string(),z.string()).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  fabric: z.string().optional(),
  basePrice: z.coerce.number().positive().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive("Price is required"),
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),
  media: z.array(VariantMediaSchema).optional(),
  stock: StockSchema,
});

// 🆕 Update Variant Schema
export const updateVariantSchema = z.object({
  attributes: z.record(z.string(), z.string()).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  fabric: z.string().optional(),
  basePrice: z.coerce.number().positive().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type AddVariantFormData = z.infer<typeof addVariantSchema>;
export type UpdateVariantFormData = z.infer<typeof updateVariantSchema>;
export type AttributeField = z.infer<typeof AttributeFieldSchema>;
