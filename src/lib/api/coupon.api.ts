import { apiCall, type ApiResponse } from "@/lib/api/api.base.service";
import type {
  Coupon,
  CreateCouponData,
  UpdateCouponData,
  ApplyCouponData,
  ApplyCouponResult,
  QueryCouponParams,
} from "../types/coupon/coupon";

// Coupon API
export const couponApi = {
  // Public endpoints
  getActiveCoupons: async (): Promise<ApiResponse<Coupon[]>> => {
    return apiCall("GET", "/coupons/active");
  },

  applyCoupon: async (
    data: ApplyCouponData
  ): Promise<ApiResponse<ApplyCouponResult>> => {
    return apiCall("POST", "/coupons/apply", data);
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
