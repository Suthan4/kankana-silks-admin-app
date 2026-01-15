import z from "zod";
import { CouponScope, CouponUserEligibility, DiscountType } from "./coupon";

// Enums
export const DiscountTypeEnum = ["PERCENTAGE", "FIXED"] as const;
export const CouponScopeEnum = z.enum(["ALL", "CATEGORY", "PRODUCT"]);
export const CouponUserEligibilityEnum = z.enum([
  "ALL",
  "FIRST_TIME",
  "NEW_USERS",
  "SPECIFIC_USERS",
]);

// Helper for optional numbers
const optionalNumber = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.coerce.number().int().positive().optional()
);


// 🆕 ENHANCED: Create Coupon Schema
export const createCouponSchema = z
  .object({
    // Basic Info
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must be less than 20 characters")
      .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and numbers only")
      .transform((val) => val.toUpperCase()),

    description: z.string().max(500).optional(),

    // Discount Settings
    discountType: z.enum(DiscountTypeEnum).optional(),

    discountValue: z.coerce
      .number()
      .positive("Discount value must be positive"),

    minOrderValue: z.coerce
      .number()
      .min(0, "Minimum order value cannot be negative")
      .default(0),

    // 🆕 NEW: Max Discount Cap
    maxDiscountAmount: z.coerce
      .number()
      .positive("Max discount must be positive")
      .optional(),

    // 🆕 NEW: Scope
    scope: CouponScopeEnum.default("ALL"),

    categoryIds: z.array(z.string()).optional(),

    productIds: z.array(z.string()).optional(),

    // 🆕 NEW: User Eligibility
    userEligibility: CouponUserEligibilityEnum.default("ALL"),

    eligibleUserIds: z.array(z.string()).optional(),

    newUserDays: optionalNumber,

    // Usage Limits
    maxUsage: optionalNumber,

    perUserLimit: optionalNumber,

    // Validity
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

    // 🆕 NEW: Scope validation
    if (data.scope === "CATEGORY") {
      if (!data.categoryIds || data.categoryIds.length === 0) {
        ctx.addIssue({
          path: ["categoryIds"],
          code: z.ZodIssueCode.custom,
          message: "At least one category must be selected for CATEGORY scope",
        });
      }
    }

    if (data.scope === "PRODUCT") {
      if (!data.productIds || data.productIds.length === 0) {
        ctx.addIssue({
          path: ["productIds"],
          code: z.ZodIssueCode.custom,
          message: "At least one product must be selected for PRODUCT scope",
        });
      }
    }

    // 🆕 NEW: User eligibility validation
    if (data.userEligibility === "SPECIFIC_USERS") {
      if (!data.eligibleUserIds || data.eligibleUserIds.length === 0) {
        ctx.addIssue({
          path: ["eligibleUserIds"],
          code: z.ZodIssueCode.custom,
          message:
            "At least one user must be selected for SPECIFIC_USERS eligibility",
        });
      }
    }

    if (data.userEligibility === "NEW_USERS") {
      if (!data.newUserDays || data.newUserDays <= 0) {
        ctx.addIssue({
          path: ["newUserDays"],
          code: z.ZodIssueCode.custom,
          message: "New user days must be specified for NEW_USERS eligibility",
        });
      }
    }

    // 🆕 NEW: Max discount validation
    if (data.maxDiscountAmount && data.discountType === "FIXED") {
      if (data.maxDiscountAmount < data.discountValue) {
        ctx.addIssue({
          path: ["maxDiscountAmount"],
          code: z.ZodIssueCode.custom,
          message:
            "Max discount amount cannot be less than the discount value",
        });
      }
    }
  });

export type CreateCouponFormData = z.infer<typeof createCouponSchema>;

// 🆕 ENHANCED: Update Coupon Schema
export const updateCouponSchema = z
  .object({
    // Basic Info
    description: z.string().max(500).optional(),

    // Discount Settings
    discountType: z.nativeEnum(DiscountType).optional(),

    discountValue: z.coerce.number().positive().optional(),

    minOrderValue: z.coerce.number().min(0).optional(),

    // 🆕 NEW: Max Discount Cap
    maxDiscountAmount: z.coerce
      .number()
      .positive("Max discount must be positive")
      .optional(),

    // 🆕 NEW: Scope
    scope: z.nativeEnum(CouponScope).optional(),

    categoryIds: z.array(z.string()).optional(),

    productIds: z.array(z.string()).optional(),

    // 🆕 NEW: User Eligibility
    userEligibility: z.nativeEnum(CouponUserEligibility).optional(),

    eligibleUserIds: z.array(z.string()).optional(),

    newUserDays: optionalNumber,

    // Usage Limits
    maxUsage: optionalNumber,

    perUserLimit: optionalNumber,

    // Validity
   validFrom: z.string().date().optional(),
   validUntil: z.string().date().optional(),

    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // ✅ Percentage discount validation
    if (
      data.discountType === "PERCENTAGE" &&
      data.discountValue &&
      data.discountValue > 100
    ) {
      ctx.addIssue({
        path: ["discountValue"],
        code: z.ZodIssueCode.custom,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    // ✅ Date validation
    if (data.validFrom && data.validUntil) {
      const validFrom = new Date(data.validFrom);
      const validUntil = new Date(data.validUntil);

      if (validFrom >= validUntil) {
        ctx.addIssue({
          path: ["validUntil"],
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
        });
      }
    }

    // 🆕 NEW: Scope validation
    if (data.scope === "CATEGORY") {
      if (!data.categoryIds || data.categoryIds.length === 0) {
        ctx.addIssue({
          path: ["categoryIds"],
          code: z.ZodIssueCode.custom,
          message: "At least one category must be selected for CATEGORY scope",
        });
      }
    }

    if (data.scope === "PRODUCT") {
      if (!data.productIds || data.productIds.length === 0) {
        ctx.addIssue({
          path: ["productIds"],
          code: z.ZodIssueCode.custom,
          message: "At least one product must be selected for PRODUCT scope",
        });
      }
    }

    // 🆕 NEW: User eligibility validation
    if (data.userEligibility === "SPECIFIC_USERS") {
      if (!data.eligibleUserIds || data.eligibleUserIds.length === 0) {
        ctx.addIssue({
          path: ["eligibleUserIds"],
          code: z.ZodIssueCode.custom,
          message:
            "At least one user must be selected for SPECIFIC_USERS eligibility",
        });
      }
    }

    if (data.userEligibility === "NEW_USERS") {
      if (!data.newUserDays || data.newUserDays <= 0) {
        ctx.addIssue({
          path: ["newUserDays"],
          code: z.ZodIssueCode.custom,
          message: "New user days must be specified for NEW_USERS eligibility",
        });
      }
    }

    // 🆕 NEW: Max discount validation
    if (
      data.maxDiscountAmount &&
      data.discountValue &&
      data.discountType === "FIXED"
    ) {
      if (data.maxDiscountAmount < data.discountValue) {
        ctx.addIssue({
          path: ["maxDiscountAmount"],
          code: z.ZodIssueCode.custom,
          message:
            "Max discount amount cannot be less than the discount value",
        });
      }
    }
  });

export type UpdateCouponFormData = z.infer<typeof updateCouponSchema>;

// Apply Coupon Schema
export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase(),
  orderAmount: z.coerce.number().positive("Order amount must be positive"),
});

export type ApplyCouponFormData = z.infer<typeof applyCouponSchema>;

// 🆕 NEW: Validate Coupon Schema (for client-side validation)
export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  orderAmount: z.coerce.number().positive("Order amount must be positive"),
  cartItems: z.array(
    z.object({
      productId: z.string(),
      categoryId: z.string().optional(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ),
});

export type ValidateCouponFormData = z.infer<typeof validateCouponSchema>;

// 🆕 NEW: Get Applicable Coupons Schema
export const getApplicableCouponsSchema = z.object({
  orderAmount: z.coerce.number().positive("Order amount must be positive"),
  cartItems: z.array(
    z.object({
      productId: z.string(),
      categoryId: z.string().optional(),
    })
  ),
});

export type GetApplicableCouponsFormData = z.infer<
  typeof getApplicableCouponsSchema
>;