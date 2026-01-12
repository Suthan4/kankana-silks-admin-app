// Updated Product Type Definitions
// Aligns with backend ProductMedia implementation

export type MediaType = "IMAGE" | "VIDEO";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

// UPDATED: ProductMedia (replaces ProductImage)
export interface ProductMedia {
  id: string;
  type: MediaType;
  url: string;
  key?: string;
  thumbnailUrl?: string;
  altText?: string;
  title?: string;
  description?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  order: number;
  isActive: boolean;
}

// UPDATED: ProductVariant now includes stock relation
export interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  fabric?: string;
  price: number;
  sku: string;
  stock?: Stock[]; // Updated to include stock array
}

export interface Specification {
  id: string;
  key: string;
  value: string;
}

// UPDATED: Stock now includes warehouse relation
export interface Stock {
  id: string;
  productId: string;
  variantId?: string | null;
  warehouseId: string;
  warehouse?: Warehouse; // Added warehouse relation
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

// UPDATED: Product interface with media and proper relations
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: any;
  basePrice: number;
  sellingPrice: number;
  sku: string;
  isActive: boolean;
  hasVariants: boolean;
  hsnCode?: string;
  artisanName?: string;
  artisanAbout?: string;
  artisanLocation?: string;
  metaTitle?: string;
  metaDesc?: string;
  schemaMarkup?: string;
  media: ProductMedia[]; // UPDATED: Changed from images
  variants?: ProductVariant[];
  specifications?: Specification[];
  stock?: Stock[]; // This is an array
  createdAt: string;
  updatedAt: string;
  _count?: {
    reviews: number;
    variants: number;
  };
}

// UPDATED: CreateProductData with media
export interface CreateProductData {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  sellingPrice: number;
  isActive?: boolean;
  hsnCode?: string;
  artisanName?: string;
  artisanAbout?: string;
  artisanLocation?: string;
  metaTitle?: string;
  metaDesc?: string;
  schemaMarkup?: string;
  specifications?: Array<{ key: string; value: string }>;
  media?: Array<{
    type?: MediaType;
    url: string;
    altText?: string;
    order?: number;
  }>;
  variants?: Array<{
    size?: string;
    color?: string;
    fabric?: string;
    price: number;
    stock?: {
      warehouseId: string;
      quantity: number;
      lowStockThreshold?: number;
    };
  }>;
  stock?: {
    warehouseId: string;
    quantity: number;
    lowStockThreshold?: number;
  };
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  categoryId?: string;
  basePrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
  hsnCode?: string;
  metaTitle?: string;
  metaDesc?: string;
  schemaMarkup?: string;
}

export interface QueryProductParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  hasVariants?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "createdAt" | "price" | "name";
  sortOrder?: "asc" | "desc";
}
