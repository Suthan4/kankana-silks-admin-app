import type {
  Category,
  CategoryListData,
  CategoryPlacement,
  CreateCategoryData,
  LinkCategoryData,
  QueryCategoryParams,
  UpdateCategoryData,
  UpdatePlacementData,
} from "../types/category/category";
import { apiCall, type ApiResponse } from "./api.base.service";

/**
 * Converts placement-based backend responses into convenient `children` and
 * `parents` arrays while preserving the original placement records.
 */
const normalizeCategory = (category: Category): Category => {
  const childPlacements = (category.childPlacements ?? []).map((placement) => ({
    ...placement,
    child: placement.child ? normalizeCategory(placement.child) : undefined,
  }));

  const parentPlacements = category.parentPlacements ?? [];

  return {
    ...category,
    childPlacements,
    parentPlacements,
    children: childPlacements
      .map((placement) => placement.child)
      .filter((child): child is Category => Boolean(child)),
    parents: parentPlacements
      .map((placement) => placement.parent)
      .filter((parent): parent is Category => Boolean(parent)),
  };
};

const normalizeCategories = (categories: Category[] = []): Category[] =>
  categories.map(normalizeCategory);

export const categoryApi = {
  getCategories: async (
    params?: QueryCategoryParams,
  ): Promise<ApiResponse<CategoryListData>> => {
    const response = await apiCall<CategoryListData>(
      "GET",
      "/categories",
      undefined,
      { params },
    );

    return {
      ...response,
      data: {
        ...response.data,
        categories: normalizeCategories(response.data?.categories),
        // Ensure pagination is always present to satisfy CategoryListData type
        pagination:
          response.data?.pagination ?? {
            page: 1,
            limit: response.data?.categories?.length ?? 0,
            total: response.data?.categories?.length ?? 0,
            totalPages: 1,
          },
      },
    };
  },

  getCategoryTree: async (): Promise<ApiResponse<Category[]>> => {
    const response = await apiCall<Category[]>("GET", "/categories/tree");

    return {
      ...response,
      data: normalizeCategories(response.data),
    };
  },

  getCategoryTreeById: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await apiCall<Category>("GET", `/categories/tree/${id}`);

    return {
      ...response,
      data: response.data ? normalizeCategory(response.data) : response.data,
    };
  },

  getCategory: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await apiCall<Category>("GET", `/categories/${id}`);

    return {
      ...response,
      data: response.data ? normalizeCategory(response.data) : response.data,
    };
  },

  getCategoryBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    const response = await apiCall<Category>("GET", `/categories/slug/${slug}`);

    return {
      ...response,
      data: response.data ? normalizeCategory(response.data) : response.data,
    };
  },

  createCategory: async (
    data: CreateCategoryData,
  ): Promise<ApiResponse<Category>> => {
    return apiCall<Category>("POST", "/categories", data);
  },

  updateCategory: async (
    id: string,
    data: UpdateCategoryData,
  ): Promise<ApiResponse<Category>> => {
    return apiCall<Category>("PUT", `/categories/${id}`, data);
  },

  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>("DELETE", `/categories/${id}`);
  },

  linkCategory: async (
    data: LinkCategoryData,
  ): Promise<ApiResponse<CategoryPlacement>> => {
    return apiCall<CategoryPlacement>("POST", "/categories/link", data);
  },

  unlinkCategory: async (placementId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>("DELETE", `/categories/placements/${placementId}`);
  },

  updatePlacement: async (
    placementId: string,
    data: UpdatePlacementData,
  ): Promise<ApiResponse<CategoryPlacement>> => {
    return apiCall<CategoryPlacement>(
      "PUT",
      `/categories/placements/${placementId}`,
      data,
    );
  },

  /** Convenience wrapper for toggling whether a placement shows the category's subcategories. */
  togglePlacementChildren: async (
    placementId: string,
    includeChildren: boolean,
  ): Promise<ApiResponse<CategoryPlacement>> => {
    return apiCall<CategoryPlacement>(
      "PUT",
      `/categories/placements/${placementId}`,
      { includeChildren },
    );
  },
};