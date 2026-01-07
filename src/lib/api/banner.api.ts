import { apiCall, type ApiResponse } from "./api.base.service";

export interface Banner {
  id: string;
  title: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
  thumbnailUrl?: string;
  link?: string;
  text?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerData {
  title: string;
  type?: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
  thumbnailUrl?: string;
  link?: string;
  text?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  isActive?: boolean;
  order?: number;
}

export interface UpdateBannerData {
  title?: string;
  type?: "IMAGE" | "VIDEO";
  url?: string;
  key?: string;
  thumbnailUrl?: string | null;
  link?: string | null;
  text?: string | null;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  isActive?: boolean;
  order?: number;
}

export interface QueryBannerParams {
  page?: number;
  limit?: number;
  type?: "IMAGE" | "VIDEO";
  isActive?: boolean;
  sortBy?: "order" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
}

// Banner API
export const bannerApi = {
  // Get all banners
  getBanners: async (
    params?: QueryBannerParams
  ): Promise<
    ApiResponse<{
      banners: Banner[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/banners", undefined, { params });
  },

  // Get active banners only
  getActiveBanners: async (): Promise<ApiResponse<Banner[]>> => {
    return apiCall("GET", "/banners/active");
  },

  // Get banner by ID
  getBanner: async (id: string): Promise<ApiResponse<Banner>> => {
    return apiCall("GET", `/banners/${id}`);
  },

  // Create banner (Admin only)
  createBanner: async (
    data: CreateBannerData
  ): Promise<ApiResponse<Banner>> => {
    return apiCall("POST", "/banners", data);
  },

  // Update banner (Admin only)
  updateBanner: async (
    id: string,
    data: UpdateBannerData
  ): Promise<ApiResponse<Banner>> => {
    return apiCall("PUT", `/banners/${id}`, data);
  },

  // Delete banner (Admin only)
  deleteBanner: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/banners/${id}`);
  },
};
