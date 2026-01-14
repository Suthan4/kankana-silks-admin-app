import type {
  CreateProductData,
  Product,
  ProductMedia,
  ProductVariant,
  ProductVariantMedia,
  QueryProductParams,
  Specification,
  Stock,
  UpdateProductData,
} from "../types/product/prodcut";
import { apiCall, type ApiResponse } from "./api.base.service";

// Product API with Enhanced Variant Support
export const productApi = {
  // ==========================================
  // PRODUCT ENDPOINTS
  // ==========================================

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

  // ==========================================
  // SPECIFICATION ENDPOINTS
  // ==========================================

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

  // ==========================================
  // PRODUCT MEDIA ENDPOINTS
  // ==========================================

  // Add product media
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
    return apiCall("POST", `/products/${productId}/media`, data);
  },

  // Delete product media
  deleteMedia: async (
    productId: string,
    mediaId: string
  ): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/products/${productId}/media/${mediaId}`);
  },

  // ==========================================
  // 🆕 VARIANT ENDPOINTS (ENHANCED)
  // ==========================================

  // Add variant (with media, pricing, dimensions)
  addVariant: async (
    productId: string,
    data: {
      // Dynamic attributes
      attributes?: Record<string, any>;

      // Legacy fields
      size?: string;
      color?: string;
      fabric?: string;

      // Pricing
      basePrice?: number;
      sellingPrice?: number;
      price: number;

      // Shipping dimensions
      weight?: number;
      length?: number;
      breadth?: number;
      height?: number;

      // Variant media
      media?: Array<{
        type?: "IMAGE" | "VIDEO";
        url: string;
        altText?: string;
        order?: number;
        thumbnailUrl?: string;
      }>;

      // Stock
      stock?: {
        warehouseId: string;
        quantity: number;
        lowStockThreshold?: number;
      };
    }
  ): Promise<ApiResponse<ProductVariant>> => {
    return apiCall("POST", `/products/${productId}/variants`, data);
  },

  // 🆕 Get variant by ID
  getVariant: async (
    productId: string,
    variantId: string
  ): Promise<ApiResponse<ProductVariant>> => {
    return apiCall("GET", `/products/${productId}/variants/${variantId}`);
  },

  // 🆕 Update variant (with pricing, dimensions, attributes)
  updateVariant: async (
    productId: string,
    variantId: string,
    data: {
      attributes?: Record<string, any>;
      size?: string;
      color?: string;
      fabric?: string;
      basePrice?: number;
      sellingPrice?: number;
      price?: number;
      weight?: number;
      length?: number;
      breadth?: number;
      height?: number;
    }
  ): Promise<ApiResponse<ProductVariant>> => {
    return apiCall("PUT", `/products/${productId}/variants/${variantId}`, data);
  },

  // Delete variant
  deleteVariant: async (
    productId: string,
    variantId: string
  ): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/products/${productId}/variants/${variantId}`);
  },

  // ==========================================
  // 🆕 VARIANT MEDIA ENDPOINTS (NEW)
  // ==========================================

  // Add media to variant
  addVariantMedia: async (
    productId: string,
    variantId: string,
    data: {
      type?: "IMAGE" | "VIDEO";
      url: string;
      altText?: string;
      order?: number;
      thumbnailUrl?: string;
      title?: string;
      description?: string;
    }
  ): Promise<ApiResponse<ProductVariantMedia>> => {
    return apiCall(
      "POST",
      `/products/${productId}/variants/${variantId}/media`,
      data
    );
  },

  // Delete variant media
  deleteVariantMedia: async (
    productId: string,
    variantId: string,
    mediaId: string
  ): Promise<ApiResponse<void>> => {
    return apiCall(
      "DELETE",
      `/products/${productId}/variants/${variantId}/media/${mediaId}`
    );
  },

  // ==========================================
  // STOCK ENDPOINTS
  // ==========================================

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
