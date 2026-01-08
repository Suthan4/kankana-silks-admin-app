// Coupon Types

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
} as const;

export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxUsage?: number;
  usageCount: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponData {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxUsage?: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
}

export interface UpdateCouponData {
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderValue?: number;
  maxUsage?: number;
  perUserLimit?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

export interface ApplyCouponData {
  code: string;
  orderAmount: number;
}

export interface ApplyCouponResult {
  coupon: Coupon;
  discount: number;
  finalAmount: number;
}

export interface QueryCouponParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  sortBy?: "code" | "createdAt" | "validUntil";
  sortOrder?: "asc" | "desc";
}
