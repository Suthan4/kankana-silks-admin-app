import z from "zod";

export const DiscountTypeEnum = z.enum(["PERCENTAGE", "FIXED"]);
const optionalNumber = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.number().int().positive().optional()
);
// Create Coupon Schema
export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must be less than 20 characters")
      .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and numbers only")
      .transform((val) => val.toUpperCase()),

    description: z.string().max(500).optional(),

    discountType: DiscountTypeEnum,

    discountValue: z.coerce
      .number()
      .positive("Discount value must be positive"),

    minOrderValue: z.coerce
      .number()
      .min(0, "Minimum order value cannot be negative")
      .default(0),

    maxUsage: optionalNumber,

    perUserLimit: optionalNumber,

    validFrom: z.string().min(1, "Start date is required"),
    validUntil: z.string().min(1, "End date is required"),

    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // ✅ Percentage discount validation
    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      ctx.addIssue({
        path: ["discountValue"],
        code: z.ZodIssueCode.custom,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    // ✅ Date validation
    const validFrom = new Date(data.validFrom);
    const validUntil = new Date(data.validUntil);

    if (validFrom >= validUntil) {
      ctx.addIssue({
        path: ["validUntil"],
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
      });
    }
  });

export type CreateCouponFormData = z.infer<typeof createCouponSchema>;

// Update Coupon Schema
export const updateCouponSchema = z.object({
  description: z.string().max(500).optional(),
  discountType: DiscountTypeEnum.optional(),
  discountValue: z.coerce.number().positive().optional(),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxUsage: optionalNumber,
  perUserLimit: optionalNumber,
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCouponFormData = z.infer<typeof updateCouponSchema>;

// Apply Coupon Schema
export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase(),
  orderAmount: z.coerce.number().positive("Order amount must be positive"),
});

export type ApplyCouponFormData = z.infer<typeof applyCouponSchema>;
