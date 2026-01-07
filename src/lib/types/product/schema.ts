import z from "zod";

const StockSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.coerce.number().int().min(0, "Quantity must be positive"),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

const SpecificationSchema = z.object({
  key: z.string().min(1, "Specification key is required"),
  value: z.string().min(1, "Specification value is required"),
});

const ImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  altText: z.string().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

const VariantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  fabric: z.string().optional(),
  price: z.coerce.number().positive("Variant price must be positive"),
  stock: StockSchema.optional(),
});

export const createProductSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    categoryId: z.string().min(1, "Category is required"),
    basePrice: z.coerce.number().positive("Base price must be positive"),
    sellingPrice: z.coerce.number().positive("Selling price must be positive"),
    isActive: z.boolean().optional(),
    hsnCode: z.string().optional(),
    artisanName: z.string().optional(),
    artisanAbout: z.string().optional(),
    artisanLocation: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDesc: z.string().optional(),
    schemaMarkup: z.string().optional(),
    specifications: z.array(SpecificationSchema).optional(),
    images: z.array(ImageSchema).optional(),
    variants: z.array(VariantSchema).optional(),
    stock: StockSchema.optional(),
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
  basePrice: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  hsnCode: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  schemaMarkup: z.string().optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
