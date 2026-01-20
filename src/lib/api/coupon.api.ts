import { apiCall, type ApiResponse } from "@/lib/api/api.base.service";
import type {
  Coupon,
  CreateCouponData,
  UpdateCouponData,
  ApplyCouponData,
  ApplyCouponResult,
  QueryCouponParams,
  ValidateCouponData,
  ValidateCouponResult,
  GetApplicableCouponsData,
} from "../types/coupon/coupon";

// Coupon API - ENHANCED
export const couponApi = {
  // 🆕 NEW: Public endpoints for validation
  getActiveCoupons: async (): Promise<ApiResponse<Coupon[]>> => {
    return apiCall("GET", "/coupons/active");
  },

  // 🆕 NEW: Validate coupon before applying
  validateCoupon: async (
    data: ValidateCouponData
  ): Promise<ApiResponse<ValidateCouponResult>> => {
    return apiCall("POST", "/coupons/validate", data);
  },

  // Apply coupon at checkout
  applyCoupon: async (
    data: ApplyCouponData
  ): Promise<ApiResponse<ApplyCouponResult>> => {
    return apiCall("POST", "/coupons/apply", data);
  },

  // 🆕 NEW: Get applicable coupons for current cart
  getApplicableCoupons: async (
    data: GetApplicableCouponsData
  ): Promise<ApiResponse<Coupon[]>> => {
    return apiCall("POST", "/coupons/applicable", data);
  },

  // Admin endpoints
  getCoupons: async (
    params?: QueryCouponParams
  ): Promise<
    ApiResponse<{
      coupons: Coupon[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/admin/coupons", undefined, { params });
  },

  getCoupon: async (id: string): Promise<ApiResponse<Coupon>> => {
    return apiCall("GET", `/admin/coupons/${id}`);
  },

  createCoupon: async (
    data: CreateCouponData
  ): Promise<ApiResponse<Coupon>> => {
    return apiCall("POST", "/admin/coupons", data);
  },

  updateCoupon: async (
    id: string,
    data: UpdateCouponData
  ): Promise<ApiResponse<Coupon>> => {
    return apiCall("PUT", `/admin/coupons/${id}`, data);
  },

  deleteCoupon: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/admin/coupons/${id}`);
  },
};