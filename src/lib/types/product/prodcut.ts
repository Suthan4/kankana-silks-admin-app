// Updated Product Type Definitions
// Aligns with backend ProductMedia implementation + Shipping Dimensions

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

// UPDATED: Product interface with media, shipping dimensions and proper relations
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

  // Artisan Information
  artisanName?: string;
  artisanAbout?: string;
  artisanLocation?: string;

  // 🆕 Shipping & Dimensions
  weight?: number; // Weight in kg
  length?: number; // Length in cm
  breadth?: number; // Breadth in cm
  height?: number; // Height in cm
  volumetricWeight?: number; // (L × B × H) / 5000

  // SEO
  metaTitle?: string;
  metaDesc?: string;
  schemaMarkup?: string;

  // Relations
  media: ProductMedia[]; // UPDATED: Changed from images
  variants?: ProductVariant[];
  specifications?: Specification[];
  stock?: Stock[]; // This is an array

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Counts
  _count?: {
    reviews: number;
    variants: number;
  };
}

// UPDATED: CreateProductData with media and shipping dimensions
export interface CreateProductData {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  sellingPrice: number;
  isActive?: boolean;
  hsnCode?: string;

  // Artisan Information
  artisanName?: string;
  artisanAbout?: string;
  artisanLocation?: string;

  // 🆕 Shipping Dimensions (Required for Shiprocket)
  weight: number; // Weight in kg (required)
  length: number; // Length in cm (required)
  breadth: number; // Breadth in cm (required)
  height: number; // Height in cm (required)
  // volumetricWeight is auto-calculated, no need to send

  // SEO
  metaTitle?: string;
  metaDesc?: string;
  schemaMarkup?: string;

  // Product Details
  specifications?: Array<{ key: string; value: string }>;
  media?: Array<{
    type?: MediaType;
    url: string;
    altText?: string;
    order?: number;
  }>;

  // Stock Configuration (Simple Product OR Variants)
  variants?: Array<{
    size?: string;
    color?: string;
    fabric?: string;
    price: number;
    stock: {
      // 🆕 Now REQUIRED for variants
      warehouseId: string;
      quantity: number;
      lowStockThreshold?: number; // Defaults to 10
    };
  }>;
  stock?: {
    warehouseId: string;
    quantity: number;
    lowStockThreshold?: number; // Defaults to 10
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

  // Artisan Information
  artisanName?: string;
  artisanAbout?: string;
  artisanLocation?: string;

  // 🆕 Shipping Dimensions (Optional in update)
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  // volumetricWeight is auto-calculated

  // SEO
  metaTitle?: string;
  metaDesc?: string;
  schemaMarkup?: string;
}

export interface QueryProductParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string; // For category + descendants filtering
  categoryIds?: string[]; // For multiple categories
  isActive?: boolean;
  hasVariants?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "createdAt" | "price" | "name" | "popularity";
  sortOrder?: "asc" | "desc";

  // Advanced Filters
  color?: string;
  fabric?: string;
  size?: string;
  artisan?: string;
  inStock?: boolean;
}
