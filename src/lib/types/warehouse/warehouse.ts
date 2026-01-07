export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isActive?: boolean;
}

export interface UpdateWarehouseData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive?: boolean;
}

export interface QueryWarehouseParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
  sortBy?: "name" | "code" | "createdAt";
  sortOrder?: "asc" | "desc";
}