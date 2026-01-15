// Enums
export enum CouponScope {
  ALL = "ALL",
  CATEGORY = "CATEGORY",
  PRODUCT = "PRODUCT",
}

export enum CouponUserEligibility {
  ALL = "ALL",
  SPECIFIC_USERS = "SPECIFIC_USERS",
  FIRST_TIME = "FIRST_TIME",
  NEW_USERS = "NEW_USERS",
}

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

// Base Coupon Type - ENHANCED
export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  
  // 🆕 NEW: Enhanced fields
  maxDiscountAmount?: number;
  scope: CouponScope;
  userEligibility: CouponUserEligibility;
  newUserDays?: number;
  
  // Usage limits
  maxUsage?: number;
  usageCount: number;
  perUserLimit?: number;
  
  // Validity
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  
  // 🆕 NEW: Relations (populated)
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
    media?: Array<{ url: string }>;
  }>;
  eligibleUsers?: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Create Coupon Data - ENHANCED
export interface CreateCouponData {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  
  // 🆕 NEW: Enhanced fields
  maxDiscountAmount?: number;
  scope: CouponScope;
  categoryIds?: string[];
  productIds?: string[];
  userEligibility: CouponUserEligibility;
  eligibleUserIds?: string[];
  newUserDays?: number;
  
  maxUsage?: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

// Update Coupon Data - ENHANCED
export interface UpdateCouponData {
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderValue?: number;
  
  // 🆕 NEW: Enhanced fields
  maxDiscountAmount?: number;
  scope?: CouponScope;
  categoryIds?: string[];
  productIds?: string[];
  userEligibility?: CouponUserEligibility;
  eligibleUserIds?: string[];
  newUserDays?: number;
  
  maxUsage?: number;
  perUserLimit?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

// Cart Item for validation
export interface CartItemData {
  productId: string;
  categoryId?: string;
  quantity: number;
  price: number;
}

// 🆕 NEW: Validate Coupon Data
export interface ValidateCouponData {
  code: string;
  orderAmount: number;
  cartItems: CartItemData[];
}

// 🆕 NEW: Validate Coupon Result
export interface ValidateCouponResult {
  valid: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
  };
  discount?: number;
  finalAmount?: number;
}

// Apply Coupon Data - ENHANCED
export interface ApplyCouponData {
  code: string;
  orderAmount: number;
  cartItems: CartItemData[];
}

// Apply Coupon Result
export interface ApplyCouponResult {
  coupon: Coupon;
  discount: number;
  finalAmount: number;
}

// 🆕 NEW: Get Applicable Coupons Data
export interface GetApplicableCouponsData {
  orderAmount: number;
  cartItems: Array<{
    productId: string;
    categoryId?: string;
  }>;
}

// Query Coupon Params - ENHANCED
export interface QueryCouponParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  scope?: CouponScope; // 🆕 NEW
  sortBy?: "code" | "createdAt" | "validUntil";
  sortOrder?: "asc" | "desc";
}