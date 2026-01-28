import type { Order, OrderStatus, PaymentMethod } from "../types/order/order";
import { apiCall, type ApiResponse } from "./api.base.service";

export interface OrderPreviewRequest {
  shippingAddressId: string;
  couponCode?: string;
  items?: Array<{ productId: string; variantId?: string; quantity: number }>;
  selectedCourierCompanyId: number;
}

export interface InitiatePaymentRequest {
  shippingAddressId: string;
  billingAddressId: string;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  items?: Array<{ productId: string; variantId?: string; quantity: number }>;
  courierPreference?: "CHEAPEST" | "FASTEST" | "CUSTOM";
  selectedCourierCompanyId?: number;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface QueryOrderParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "total" | "orderNumber";
  sortOrder?: "asc" | "desc";
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface CancelOrderRequest {
  reason?: string;
}

// Order API
export const orderApi = {
  // User Endpoints
  getOrderPreview: async (
    data: OrderPreviewRequest
  ): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/orders/preview", data);
  },

  initiatePayment: async (
    data: InitiatePaymentRequest
  ): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/orders/initiate-payment", data);
  },

  verifyPayment: async (
    data: VerifyPaymentRequest
  ): Promise<ApiResponse<Order>> => {
    return apiCall("POST", "/orders/verify-payment", data);
  },

  getMyOrders: async (
    params?: QueryOrderParams
  ): Promise<
    ApiResponse<{
      orders: Order[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/orders/my-orders", undefined, { params });
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    return apiCall("GET", `/orders/${id}`);
  },

  getOrderByNumber: async (orderNumber: string): Promise<ApiResponse<Order>> => {
    return apiCall("GET", `/orders/number/${orderNumber}`);
  },

  canCancelOrder: async (
    id: string
  ): Promise<ApiResponse<{ canCancel: boolean; reason?: string }>> => {
    return apiCall("GET", `/orders/${id}/can-cancel`);
  },

  cancelOrder: async (
    id: string,
    data: CancelOrderRequest
  ): Promise<ApiResponse<any>> => {
    return apiCall("POST", `/orders/${id}/cancel`, data);
  },

  // Admin Endpoints
  getAllOrders: async (
    params?: QueryOrderParams
  ): Promise<
    ApiResponse<{
      orders: Order[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/admin/orders", undefined, { params });
  },

  updateOrderStatus: async (
    id: string,
    data: UpdateOrderStatusRequest
  ): Promise<ApiResponse<Order>> => {
    return apiCall("PUT", `/admin/orders/${id}/status`, data);
  },
};