import type { 
  CreateProductData, 
  Product, 
  ProductMedia,  // UPDATED: Changed from ProductImage
  ProductVariant, 
  QueryProductParams, 
  Specification, 
  Stock, 
  UpdateProductData 
} from "../types/product/prodcut";
import { apiCall, type ApiResponse } from "./api.base.service";

// Product API
export const productApi = {
  // Get all products
  getProducts: async (
    params?: QueryProductParams
  ): Promise<
    ApiResponse<{
      products: Product[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/products", undefined, { params });
  },

  // Get product by ID
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    return apiCall("GET", `/products/${id}`);
  },

  // Get product by slug
  getProductBySlug: async (slug: string): Promise<ApiResponse<Product>> => {
    return apiCall("GET", `/products/slug/${slug}`);
  },

  // Create product (Admin only)
  createProduct: async (
    data: CreateProductData
  ): Promise<ApiResponse<Product>> => {
    return apiCall("POST", "/products", data);
  },

  // Update product (Admin only)
  updateProduct: async (
    id: string,
    data: UpdateProductData
  ): Promise<ApiResponse<Product>> => {
    return apiCall("PUT", `/products/${id}`, data);
  },

  // Delete product (Admin only)
  deleteProduct: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/products/${id}`);
  },

  // Add specification
  addSpecification: async (
    productId: string,
    data: { key: string; value: string }
  ): Promise<ApiResponse<Specification>> => {
    return apiCall("POST", `/products/${productId}/specifications`, data);
  },

  // Update specification
  updateSpecification: async (
    productId: string,
    specId: string,
    value: string
  ): Promise<ApiResponse<Specification>> => {
    return apiCall("PUT", `/products/${productId}/specifications/${specId}`, {
      value,
    });
  },

  // Delete specification
  deleteSpecification: async (
    productId: string,
    specId: string
  ): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/products/${productId}/specifications/${specId}`);
  },

  // UPDATED: Add media (replaces addImage)
  addMedia: async (
    productId: string,
    data: { 
      type?: "IMAGE" | "VIDEO";
      url: string; 
      altText?: string; 
      order?: number;
      thumbnailUrl?: string;
      title?: string;
      description?: string;
    }
  ): Promise<ApiResponse<ProductMedia>> => {
    return apiCall("POST", `/products/${productId}/images`, data);
  },

  // UPDATED: Delete media (replaces deleteImage)
  deleteMedia: async (
    productId: string,
    mediaId: string
  ): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/products/${productId}/images/${mediaId}`);
  },

  // Add variant
  addVariant: async (
    productId: string,
    data: {
      size?: string;
      color?: string;
      fabric?: string;
      price: number;
      stock?: {
        warehouseId: string;
        quantity: number;
        lowStockThreshold?: number;
      };
    }
  ): Promise<ApiResponse<ProductVariant>> => {
    return apiCall("POST", `/products/${productId}/variants`, data);
  },

  // Delete variant
  deleteVariant: async (
    productId: string,
    variantId: string
  ): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/products/${productId}/variants/${variantId}`);
  },

  // Get stock
  getStock: async (
    productId: string,
    params: { warehouseId: string; variantId?: string }
  ): Promise<ApiResponse<Stock>> => {
    return apiCall("GET", `/products/${productId}/stock`, undefined, {
      params,
    });
  },

  // Update stock
  updateStock: async (
    productId: string,
    data: {
      variantId?: string;
      warehouseId: string;
      quantity: number;
      lowStockThreshold?: number;
      reason: string;
    }
  ): Promise<ApiResponse<Stock>> => {
    return apiCall("PUT", `/products/${productId}/stock`, data);
  },
};