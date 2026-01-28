import type { Return, ReturnStatus, ReturnReason, RefundMethod } from "../types/return/return";
import { apiCall, type ApiResponse } from "./api.base.service";

export interface CreateReturnRequest {
  orderId: string;
  orderItems: Array<{
    orderItemId: string;
    quantity: number;
    reason: ReturnReason;
  }>;
  reasonDetails: string;
  media?: Array<{
    type: "IMAGE" | "VIDEO";
    url: string;
    key?: string;
    thumbnailUrl?: string;
    mimeType?: string;
    fileSize?: number;
    duration?: number;
    width?: number;
    height?: number;
    order?: number;
    description?: string;
  }>;
  images?: string[];
  refundMethod: RefundMethod;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
}

export interface QueryReturnParams {
  page?: number;
  limit?: number;
  status?: ReturnStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "returnNumber" | "refundAmount";
  sortOrder?: "asc" | "desc";
}

export interface UpdateReturnStatusRequest {
  status: ReturnStatus;
  adminNotes?: string;
  rejectionReason?: string;
}

// Return API
export const returnApi = {
  // User Endpoints
  checkReturnEligibility: async (
    orderId: string
  ): Promise<
    ApiResponse<{
      eligible: boolean;
      reason?: string;
      returnWindowHours: number;
      deliveredAt?: string;
      hoursRemaining?: number;
      daysRemaining?: number;
    }>
  > => {
    return apiCall("GET", `/returns/eligibility/${orderId}`);
  },

  createReturn: async (
    data: CreateReturnRequest
  ): Promise<ApiResponse<Return>> => {
    return apiCall("POST", "/returns", data);
  },

  getMyReturns: async (
    params?: QueryReturnParams
  ): Promise<
    ApiResponse<{
      returns: Return[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/returns/my-returns", undefined, { params });
  },

  getReturn: async (id: string): Promise<ApiResponse<Return>> => {
    return apiCall("GET", `/returns/${id}`);
  },

  trackReturnShipment: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall("GET", `/returns/${id}/track`);
  },

  // Admin Endpoints
  getAllReturns: async (
    params?: QueryReturnParams
  ): Promise<
    ApiResponse<{
      returns: Return[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/admin/returns", undefined, { params });
  },

  approveReturn: async (
    id: string,
    adminNotes?: string
  ): Promise<ApiResponse<Return>> => {
    return apiCall("POST", `/admin/returns/${id}/approve`, { adminNotes });
  },

  rejectReturn: async (
    id: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<ApiResponse<Return>> => {
    return apiCall("POST", `/admin/returns/${id}/reject`, {
      rejectionReason,
      adminNotes,
    });
  },

  processRefund: async (id: string): Promise<ApiResponse<Return>> => {
    return apiCall("POST", `/admin/returns/${id}/process-refund`);
  },
};