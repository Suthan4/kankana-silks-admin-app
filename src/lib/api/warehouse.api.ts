import type {
  CreateWarehouseData,
  UpdateWarehouseData,
  Warehouse,
} from "../types/warehouse/warehouse";
import { apiCall, type ApiResponse } from "./api.base.service";

// Warehouse API
export const warehouseApi = {
  // Get all warehouses
  getWarehouses: async (
    params?: any
  ): Promise<
    ApiResponse<{
      warehouses: Warehouse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/admin/warehouses", undefined, { params });
  },

  // Get active warehouses
  getActiveWarehouses: async (): Promise<ApiResponse<Warehouse[]>> => {
    return apiCall("GET", "/admin/warehouses/active");
  },

  // Get warehouse by ID
  getWarehouse: async (id: string): Promise<ApiResponse<Warehouse>> => {
    return apiCall("GET", `/admin/warehouses/${id}`);
  },

  // Get warehouse stock
  getWarehouseStock: async (
    id: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    return apiCall(
      "GET",
      `/admin/warehouses/${id}/stock?${queryParams.toString()}`
    );
  },

  // Create warehouse
  createWarehouse: async (
    data: CreateWarehouseData
  ): Promise<ApiResponse<Warehouse>> => {
    return apiCall("POST", "/admin/warehouses", data);
  },

  // Update warehouse
  updateWarehouse: async (
    id: string,
    data: UpdateWarehouseData
  ): Promise<ApiResponse<Warehouse>> => {
    return apiCall("PUT", `/admin/warehouses/${id}`, data);
  },

  // Delete warehouse
  deleteWarehouse: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/admin/warehouses/${id}`);
  },
};
