import { apiCall, type ApiResponse } from "./api.base.service";

export interface ProductRequest {
  id: string;
  requestNumber: string;
  userId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED" | "CANCELLED";
  customerNote?: string;
  adminNote?: string;
  notifyWhenAvailable: boolean;
  estimatedAvailability?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  fulfilledAt?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    media?: Array<{
      url: string;
      type: string;
    }>;
  };
  variant?: {
    id: string;
    size?: string;
    color?: string;
    fabric?: string;
    sku: string;
  };
  order?: any;
}

type ProductRequestListResponse = ApiResponse<{
  requests: ProductRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

export const productRequestApi = {
  // User endpoints
  createRequest: async (data: {
    productId: string;
    variantId?: string;
    quantity: number;
    customerNote?: string;
  }): Promise<ApiResponse<ProductRequest>> => {
    return apiCall("POST", "/product-requests", data);
  },

  getUserRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ProductRequestListResponse> => {
    return apiCall("GET", "/product-requests/my-requests", undefined, {
      params,
    });
  },

  getRequest: async (id: string): Promise<ApiResponse<ProductRequest>> => {
    return apiCall("GET", `/product-requests/${id}`);
  },

  cancelRequest: async (id: string): Promise<ApiResponse<ProductRequest>> => {
    return apiCall("DELETE", `/product-requests/${id}`);
  },

  // Admin endpoints
  getAllRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ProductRequestListResponse> => {
    return apiCall("GET", "/admin/product-requests", undefined, { params });
  },

  approveRequest: async (
    id: string,
    data: {
      adminNote?: string;
      estimatedAvailability?: string;
    }
  ): Promise<ApiResponse<ProductRequest>> => {
    return apiCall("PATCH", `/admin/product-requests/${id}/approve`, data);
  },

  rejectRequest: async (
    id: string,
    adminNote: string
  ): Promise<ApiResponse<ProductRequest>> => {
    return apiCall("PATCH", `/admin/product-requests/${id}/reject`, {
      adminNote,
    });
  },

  fulfillRequest: async (
    id: string,
    orderId: string
  ): Promise<ApiResponse<ProductRequest>> => {
    return apiCall("PATCH", `/admin/product-requests/${id}/fulfill`, {
      orderId,
    });
  },
};
