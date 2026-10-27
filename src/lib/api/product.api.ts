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
import apiClient, { apiCall, type ApiResponse } from "./api.base.service";
import type {
  BulkCategoryNode,
  BulkCategoryLookup,
  BulkValidationResponse,
  BulkImportResponse,
  BulkImportDraft,
  BulkImportJob,
  ImageMatchResult,
  DriveFolder,
  DriveFile,
  BulkWarehouse,
} from "../types/product/bulkProduct";

// Product API with Enhanced Variant and Bulk Support
export const productApi = {
  // ==========================================
  // BULK PRODUCT IMPORT ENDPOINTS
  // ==========================================

  getBulkCategoryTree: async (): Promise<
    ApiResponse<{
      tree: BulkCategoryNode[];
      flatList: BulkCategoryLookup[];
    }>
  > => {
    return apiCall("GET", "/products/bulk/categories-tree");
  },

  getWarehouses: async (): Promise<ApiResponse<{ warehouses: BulkWarehouse[] }>> => {
    return apiCall("GET", "/products/bulk/warehouses");
  },

  downloadBulkTemplate: async (categoryIds?: string[]): Promise<Blob> => {
    const params =
      categoryIds && categoryIds.length > 0
        ? { categoryIds: categoryIds.join(",") }
        : undefined;
    const response = await apiClient.get("/products/bulk/template", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  exportBulkProducts: async (
    products: any[],
    categoryIds?: string[]
  ): Promise<Blob> => {
    const response = await apiClient.post(
      "/products/bulk/export",
      { products, categoryIds },
      { responseType: "blob" }
    );
    return response.data;
  },

  validateBulkFile: async (
    file: File
  ): Promise<ApiResponse<BulkValidationResponse>> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiCall("POST", "/products/bulk/validate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  validateBulkProducts: async (
    products: any[]
  ): Promise<ApiResponse<BulkValidationResponse>> => {
    return apiCall("POST", "/products/bulk/validate", { products });
  },

  importBulkFile: async (
    file: File
  ): Promise<ApiResponse<BulkImportResponse>> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiCall("POST", "/products/bulk/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  importBulkProducts: async (
    products: any[]
  ): Promise<ApiResponse<BulkImportResponse>> => {
    return apiCall("POST", "/products/bulk/import", { products });
  },

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
    return apiCall("GET", "/admin/products", undefined, { params });
  },

  // Get product by ID
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    return apiCall("GET", `/products/${id}`);
  },

  // Alias getProductById
  getProductById: async (id: string): Promise<ApiResponse<Product>> => {
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

  // Partial update product (Admin only)
  patchProduct: async (
    id: string,
    data: any
  ): Promise<ApiResponse<Product>> => {
    return apiCall("PATCH", `/products/${id}`, data);
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
  // VARIANT ENDPOINTS (ENHANCED)
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

  // Get variant by ID
  getVariant: async (
    productId: string,
    variantId: string
  ): Promise<ApiResponse<ProductVariant>> => {
    return apiCall("GET", `/products/${productId}/variants/${variantId}`);
  },

  // Update variant (with pricing, dimensions, attributes)
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
  // VARIANT MEDIA ENDPOINTS (NEW)
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

  // ==========================================
  // BULK IMPORT DRAFT ENDPOINTS
  // ==========================================

  createDraft: async (rawInput: string): Promise<ApiResponse<BulkImportDraft>> => {
    return apiCall("POST", "/products/bulk/draft", { rawInput });
  },

  listDrafts: async (): Promise<ApiResponse<BulkImportDraft[]>> => {
    return apiCall("GET", "/products/bulk/draft");
  },

  getDraft: async (id: string): Promise<ApiResponse<BulkImportDraft>> => {
    return apiCall("GET", `/products/bulk/draft/${id}`);
  },

  updateDraft: async (
    id: string,
    data: {
      rawInput?: string;
      confirmedAssignments?: Record<string, string>;
      parsedData?: any;
      status?: string;
    }
  ): Promise<ApiResponse<BulkImportDraft>> => {
    return apiCall("PATCH", `/products/bulk/draft/${id}`, data);
  },

  deleteDraft: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/products/bulk/draft/${id}`);
  },

  parseDraftFile: async (id: string, file: File): Promise<ApiResponse<BulkImportDraft>> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiCall("POST", `/products/bulk/draft/${id}/parse`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  parseDraftText: async (id: string, rawInput: string): Promise<ApiResponse<BulkImportDraft>> => {
    return apiCall("POST", `/products/bulk/draft/${id}/parse`, { rawInput });
  },

  matchDriveImages: async (
    id: string,
    folderId: string
  ): Promise<ApiResponse<BulkImportDraft | ImageMatchResult>> => {
    return apiCall("POST", `/products/bulk/draft/${id}/match-drive`, { folderId });
  },

  confirmDriveAssignment: async (
    id: string,
    assignments: Record<string, string>
  ): Promise<ApiResponse<BulkImportDraft>> => {
    return apiCall("PATCH", `/products/bulk/draft/${id}`, {
      confirmedAssignments: assignments,
    });
  },

  // ==========================================
  // GOOGLE DRIVE ENDPOINTS
  // ==========================================

  /**
   * Check whether the current admin user has an active Google Drive connection.
   * Returns { connected: boolean, connectUrl: string | null }
   */
  getDriveStatus: async (
    draftId?: string
  ): Promise<ApiResponse<{ connected: boolean; connectUrl: string | null }>> => {
    return apiCall("GET", "/auth/drive/status", undefined, {
      params: draftId ? { draftId } : undefined,
    });
  },

  listDriveFolders: async (
    parentId?: string
  ): Promise<ApiResponse<DriveFolder[] | { folders: DriveFolder[] }>> => {
    return apiCall("GET", "/products/bulk/drive/folders", undefined, {
      params: parentId ? { parentId } : undefined,
    });
  },

  /**
   * Browse Drive image metadata without downloading image contents.
   * The bulk-drive backend route should return { files, folders, nextPageToken }.
   */
  listDriveFiles: async (params: {
    parentId: string;
    pageToken?: string;
    query?: string;
    pageSize?: number;
  }): Promise<ApiResponse<{
    files: DriveFile[];
    folders: DriveFolder[];
    nextPageToken?: string | null;
  }>> => {
    return apiCall("GET", "/products/bulk/drive/files", undefined, {
      params: {
        parentId: params.parentId,
        pageToken: params.pageToken,
        query: params.query || undefined,
        pageSize: params.pageSize ?? 60,
      },
    });
  },

  /**
   * Upload one selected image through the existing backend S3 upload endpoint.
   * The API returns the canonical storage URL and key; never persist a blob URL.
   */
  uploadBulkImageFile: async (file: File): Promise<ApiResponse<{
    success: boolean;
    url: string;
    key: string;
  }>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");
    return apiCall("POST", "/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getDriveProxyUrl: (fileId: string): string => {
    const token = localStorage.getItem("accessToken");
    const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    return `${base}/products/bulk/drive-proxy/${fileId}?token=${token}`;
  },

  // ==========================================
  // BACKGROUND IMPORT JOB ENDPOINTS
  // ==========================================

  startDraftImport: async (draftId: string): Promise<ApiResponse<BulkImportJob>> => {
    return apiCall("POST", `/products/bulk/draft/${draftId}/import`);
  },

  startImportJob: async (draftId: string): Promise<ApiResponse<BulkImportJob>> => {
    return apiCall("POST", "/products/bulk/import-job", { draftId });
  },

  getJobStatus: async (jobId: string): Promise<ApiResponse<BulkImportJob>> => {
    return apiCall("GET", `/products/bulk/job/${jobId}`);
  },

  retryJob: async (jobId: string): Promise<ApiResponse<BulkImportJob>> => {
    return apiCall("POST", `/products/bulk/job/${jobId}/retry`);
  },
};
