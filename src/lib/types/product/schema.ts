import z from "zod";

// Stock Schema - Used for both simple products and variants
export const StockSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.coerce.number().int().min(0, "Quantity must be positive"),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
});

export const SpecificationSchema = z.object({
  key: z.string().min(1, "Specification key is required"),
  value: z.string().min(1, "Specification value is required"),
});

// Media Schema for product-level media
export const MediaSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]).optional().default("IMAGE"),
  url: z.string().min(1, "Media URL is required"),
  key: z.string().optional(),
  thumbnailUrl: z.string().optional(),
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
  isPrimary: z.boolean().optional(),
  file: z.any().optional(),
  preview: z.string().optional(),
});

// Variant Media Schema
export const VariantMediaSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]).optional().default("IMAGE"),
  url: z.string().min(1, "Media URL is required"),
  key: z.string().optional(),
  thumbnailUrl: z.string().optional(),
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
  isPrimary: z.boolean().optional(),
  file: z.any().optional(),
  preview: z.string().optional(),
});

// Dynamic Attribute Field Schema (for UI)
export const AttributeFieldSchema = z.object({
  key: z.string().min(1, "Attribute name is required"),
  value: z.string().min(1, "Attribute value is required"),
});

// ==========================================
// 🆕 MODERN UNIFIED SCHEMAS (NEW)
// ==========================================

// Option Generator Schema (e.g., Color -> ["Red", "Blue"])
export const VariantOptionSchema = z.object({
  name: z.string().min(1, "Option name is required"),
  values: z.array(z.string().min(1, "Value cannot be empty")),
});

// Modern Variant Form Schema
export const VariantFormSchema = z.object({
  id: z.string().optional(),
  variantId: z.string().optional(),
  sku: z.string().min(1, "Variant SKU is required"),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  size: z.string().optional(),
  color: z.string().optional(),
  fabric: z.string().optional(),
  basePrice: z.coerce.number().positive("Base price must be positive").optional(),
  sellingPrice: z.coerce.number().positive("Selling price must be positive").optional(),
  price: z.coerce.number().positive("Variant price must be positive"),
  weight: z.coerce.number().positive().max(50, "Max 50kg").optional(),
  length: z.coerce.number().positive().max(200, "Max 200cm").optional(),
  breadth: z.coerce.number().positive().max(200, "Max 200cm").optional(),
  height: z.coerce.number().positive().max(200, "Max 200cm").optional(),
  media: z.array(VariantMediaSchema).optional().default([]),
  stock: StockSchema,
});

// Modern Unified Product Form Schema with Conditional Validation
export const ProductFormSchema = z
  .object({
    hasVariants: z.boolean().default(false),
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    categoryId: z.string().min(1, "Category is required"),
    sku: z.string().optional(),
    isActive: z.boolean().default(true),
    hsnCode: z.string().optional(),
    artisanName: z.string().optional(),
    artisanAbout: z.string().optional(),
    artisanLocation: z.string().optional(),
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
    basePrice: z.coerce.number().positive("Base price must be positive").optional(),
    sellingPrice: z.coerce.number().positive("Selling price must be positive").optional(),
    stock: StockSchema.optional(),
    options: z.array(VariantOptionSchema).optional().default([]),
    variants: z.array(VariantFormSchema).optional().default([]),
    specifications: z.array(SpecificationSchema).optional().default([]),
    media: z.array(MediaSchema).optional().default([]),
    allowOutOfStockOrders: z.boolean().default(true),
    hasVideoConsultation: z.boolean().default(true),
    videoPurchasingEnabled: z.boolean().default(true),
    videoConsultationNote: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDesc: z.string().optional(),
    schemaMarkup: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasVariants) {
      if (!data.basePrice || Number(data.basePrice) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["basePrice"],
          message: "Base price is required and must be greater than 0",
        });
      }
      if (!data.sellingPrice || Number(data.sellingPrice) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sellingPrice"],
          message: "Selling price is required and must be greater than 0",
        });
      }
      if (
        data.basePrice &&
        data.sellingPrice &&
        Number(data.sellingPrice) > Number(data.basePrice)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sellingPrice"],
          message: "Selling price cannot exceed base price",
        });
      }
      if (!data.stock || !data.stock.warehouseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stock", "warehouseId"],
          message: "Warehouse is required for product stock",
        });
      }
      if (
        data.stock &&
        (data.stock.quantity === undefined ||
          data.stock.quantity === null ||
          Number(data.stock.quantity) < 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stock", "quantity"],
          message: "Stock quantity must be positive or zero",
        });
      }
    } else {
      if (!data.variants || data.variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "At least one variant is required when variants are enabled",
        });
      } else {
        const seenSkus = new Set<string>();
        data.variants.forEach((variant, index) => {
          if (!variant.sku || !variant.sku.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["variants", index, "sku"],
              message: "Variant SKU is required",
            });
          } else {
            const cleanSku = variant.sku.trim().toLowerCase();
            if (seenSkus.has(cleanSku)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["variants", index, "sku"],
                message: `Duplicate SKU "${variant.sku}". Each variant must have a unique SKU.`,
              });
            }
            seenSkus.add(cleanSku);
          }

          if (!variant.stock || !variant.stock.warehouseId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["variants", index, "stock", "warehouseId"],
              message: "Warehouse is required for variant stock",
            });
          }
          if (
            variant.stock &&
            (variant.stock.quantity === undefined ||
              variant.stock.quantity === null ||
              Number(variant.stock.quantity) < 0)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["variants", index, "stock", "quantity"],
              message: "Variant stock quantity must be positive or zero",
            });
          }
          if (
            variant.sellingPrice &&
            variant.basePrice &&
            Number(variant.sellingPrice) > Number(variant.basePrice)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["variants", index, "sellingPrice"],
              message: "Variant selling price cannot exceed base price",
            });
          }
        });
      }
    }
  });

// Schema for PATCH partial updates (Section-level / Variant-level)
export const PatchVariantSchema = z.object({
  id: z.string().optional(),
  variantId: z.string().optional(),
  sku: z.string().optional(),
  basePrice: z.coerce.number().positive().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  stock: z
    .object({
      warehouseId: z.string(),
      quantity: z.coerce.number().int().min(0),
      lowStockThreshold: z.coerce.number().int().min(0).optional(),
    })
    .optional(),
});

export const PatchProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  basePrice: z.coerce.number().positive().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
  hsnCode: z.string().optional(),
  artisanName: z.string().optional(),
  artisanAbout: z.string().optional(),
  artisanLocation: z.string().optional(),
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  schemaMarkup: z.string().optional(),
  allowOutOfStockOrders: z.boolean().optional(),
  hasVideoConsultation: z.boolean().optional(),
  videoPurchasingEnabled: z.boolean().optional(),
  videoConsultationNote: z.string().optional(),
  variant: PatchVariantSchema.optional(),
  variants: z.array(PatchVariantSchema).optional(),
  stock: z
    .object({
      warehouseId: z.string(),
      quantity: z.coerce.number().int().min(0),
      lowStockThreshold: z.coerce.number().int().min(0).optional(),
    })
    .optional(),
});

// ==========================================
// LEGACY COMPATIBILITY SCHEMAS (PRESERVED)
// ==========================================

export const VariantSchema = z.object({
  attributes: z.record(z.string(), z.string()).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  fabric: z.string().optional(),
  basePrice: z.coerce.number().positive().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive("Variant price must be positive"),
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),
  media: z.array(VariantMediaSchema).optional(),
  stock: StockSchema,
});

export const createProductSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    categoryId: z.string().min(1, "Category is required"),
    basePrice: z.coerce.number().positive("Base price must be positive"),
    sellingPrice: z.coerce.number().positive("Selling price must be positive"),
    sku: z.string().optional(),
    isActive: z.boolean().optional().default(true),
    hsnCode: z.string().optional(),
    artisanName: z.string().optional(),
    artisanAbout: z.string().optional(),
    artisanLocation: z.string().optional(),
    weight: z.coerce.number().positive("Weight must be positive").max(50),
    length: z.coerce.number().positive("Length must be positive").max(200),
    breadth: z.coerce.number().positive("Breadth must be positive").max(200),
    height: z.coerce.number().positive("Height must be positive").max(200),
    metaTitle: z.string().optional(),
    metaDesc: z.string().optional(),
    schemaMarkup: z.string().optional(),
    specifications: z.array(SpecificationSchema).optional(),
    media: z.array(MediaSchema).optional(),
    variants: z.array(VariantSchema).optional(),
    stock: StockSchema.optional(),
    allowOutOfStockOrders: z.boolean().optional().default(true),
    hasVideoConsultation: z.boolean().optional().default(true),
    videoPurchasingEnabled: z.boolean().optional().default(true),
    videoConsultationNote: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasVariants = data.variants && data.variants.length > 0;
      const hasStock = !!data.stock;
      if (hasVariants && hasStock) return false;
      if (!hasVariants && !hasStock) return false;
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
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
  hsnCode: z.string().optional(),
  artisanName: z.string().optional(),
  artisanAbout: z.string().optional(),
  artisanLocation: z.string().optional(),
  weight: z.coerce.number().positive().max(50).optional(),
  length: z.coerce.number().positive().max(200).optional(),
  breadth: z.coerce.number().positive().max(200).optional(),
  height: z.coerce.number().positive().max(200).optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  schemaMarkup: z.string().optional(),
});

export const addVariantSchema = z.object({
  attributes: z.record(z.string(), z.string()).optional(),
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

// Modern Inferred Types
export type ProductFormValues = z.infer<typeof ProductFormSchema>;
export type VariantFormValues = z.infer<typeof VariantFormSchema>;
export type VariantOption = z.infer<typeof VariantOptionSchema>;
export type PatchProductPayload = z.infer<typeof PatchProductSchema>;
export type PatchVariantPayload = z.infer<typeof PatchVariantSchema>;

// Legacy Inferred Types
export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type AddVariantFormData = z.infer<typeof addVariantSchema>;
export type UpdateVariantFormData = z.infer<typeof updateVariantSchema>;
export type AttributeField = z.infer<typeof AttributeFieldSchema>;
