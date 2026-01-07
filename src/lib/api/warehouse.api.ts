import type { CreateWarehouseData, QueryWarehouseParams, UpdateWarehouseData, Warehouse } from "../types/warehouse/warehouse";
import { apiCall, type ApiResponse } from "./api.base.service";


// Warehouse API
export const warehouseApi = {
  // Get all warehouses
  getWarehouses: async (
    params?: QueryWarehouseParams
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
  getWarehouseStock: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall("GET", `/admin/warehouses/${id}/stock`);
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
