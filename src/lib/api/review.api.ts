import type { ApiResponse } from "./api.base.service";
import { apiCall } from "./api.base.service";

// Types
export interface Review {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    media: Array<{
      url: string;
      type: string;
    }>;
  };
  order?: {
    id: string;
    orderNumber: string;
  };
  media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
  }>;
}

export interface QueryReviewParams {
  page?: number;
  limit?: number;
  productId?: string;
  rating?: number;
  isApproved?: boolean;
  isVerifiedPurchase?: boolean;
  sortBy?: "createdAt" | "rating" | "helpfulCount";
  sortOrder?: "asc" | "desc";
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReviewRequest {
  productId: string;
  orderId?: string;
  rating: number;
  comment?: string;
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
  }>;
  images?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
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
  }>;
  images?: string[];
}

export interface ApproveReviewRequest {
  isApproved: boolean;
}

export const reviewApi = {
  // Admin Endpoints
  getAllReviews: async (
        params?: QueryReviewParams
  ): Promise<ApiResponse<ReviewsResponse>> => {
    return apiCall("GET", "/admin/reviews", { params });
  },

  approveReview: async (
    id: string,
    data: ApproveReviewRequest
  ): Promise<ApiResponse<Review>> => {
    return apiCall("PUT", `/admin/reviews/${id}/approve`, data);
  },

  adminDeleteReview: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/admin/reviews/${id}`);
  },
}