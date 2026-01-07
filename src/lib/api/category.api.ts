import type { Category, CreateCategoryData, QueryCategoryParams, UpdateCategoryData } from "../types/category/category";
import { apiCall, type ApiResponse } from "./api.base.service";



// Category API
export const categoryApi = {
  // Get all categories
  getCategories: async (
    params?: QueryCategoryParams
  ): Promise<
    ApiResponse<{
      categories: Category[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/categories", undefined, { params });
  },

  // Get category tree
  getCategoryTree: async (): Promise<ApiResponse<Category[]>> => {
    return apiCall("GET", "/categories/tree");
  },

  // Get category by ID
  getCategory: async (id: string): Promise<ApiResponse<Category>> => {
    return apiCall("GET", `/categories/${id}`);
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    return apiCall("GET", `/categories/slug/${slug}`);
  },

  // Create category (Admin only)
  createCategory: async (
    data: CreateCategoryData
  ): Promise<ApiResponse<Category>> => {
    return apiCall("POST", "/categories", data);
  },

  // Update category (Admin only)
  updateCategory: async (
    id: string,
    data: UpdateCategoryData
  ): Promise<ApiResponse<Category>> => {
    return apiCall("PUT", `/categories/${id}`, data);
  },

  // Delete category (Admin only)
  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/categories/${id}`);
  },
};
