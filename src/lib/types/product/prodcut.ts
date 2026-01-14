// Enhanced Product Type Definitions with Variant Media, Pricing & Dimensions

export type MediaType = "IMAGE" | "VIDEO";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

// Product Media (for product-level media)
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

// 🆕 Variant Media (for variant-specific media)
export interface ProductVariantMedia {
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

// 🆕 ENHANCED: ProductVariant with media, pricing, dimensions, and attributes
export interface ProductVariant {
  id: string;

  // Dynamic attributes (flexible key-value pairs)
  attributes?: Record<string, any>;

  // Legacy fields (backward compatibility)
  size?: string;
  color?: string;
  fabric?: string;

  // 🆕 Variant-specific pricing (optional - falls back to product pricing)
  basePrice?: number;
  sellingPrice?: number;
  price: number; // Legacy price field

  // 🆕 Variant-specific shipping dimensions
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  volumetricWeight?: number;

  sku: string;

  // 🆕 Variant-specific media
  media?: ProductVariantMedia[];
  stock?: Stock[];
}

export interface Specification {
  id: string;
  key: string;
  value: string;
}

export interface Stock {
  id: string;
  productId: string;
  variantId?: string | null;
  warehouseId: string;
  warehouse?: Warehouse;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}

// Product interface with all enhancements
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

  // Shipping & Dimensions
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  volumetricWeight?: number;

  // SEO
  metaTitle?: string;
  metaDesc?: string;
  schemaMarkup?: string;

  // Relations
  media: ProductMedia[];
  variants?: ProductVariant[];
  specifications?: Specification[];
  stock?: Stock[];

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Counts
  _count?: {
    reviews: number;
    variants: number;
  };
}

// 🆕 ENHANCED: CreateProductData with variant enhancements
export interface CreateProductData {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  sellingPrice: number;
  sku?: string; // 🆕 Optional - auto-generated if not provided
  isActive?: boolean;
  hsnCode?: string;

  // Artisan Information
  artisanName?: string;
  artisanAbout?: string;
  artisanLocation?: string;

  // Shipping Dimensions (Required)
  weight: number;
  length: number;
  breadth: number;
  height: number;

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

  // 🆕 ENHANCED: Variants with media, pricing, dimensions
  variants?: Array<{
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

    // 🆕 Variant-specific media
    media?: Array<{
      type?: MediaType;
      url: string;
      altText?: string;
      order?: number;
      thumbnailUrl?: string;
    }>;

    stock: {
      warehouseId: string;
      quantity: number;
      lowStockThreshold?: number;
    };
  }>;

  // Simple product stock
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
  sku?: string; // 🆕 Allow SKU updates
  isActive?: boolean;
  hsnCode?: string;

  // Artisan Information
  artisanName?: string;
  artisanAbout?: string;
  artisanLocation?: string;

  // Shipping Dimensions
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;

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
  categorySlug?: string;
  categoryIds?: string[];
  isActive?: boolean;
  hasVariants?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "createdAt" | "price" | "name" | "popularity";
  sortOrder?: "asc" | "desc";
  color?: string;
  fabric?: string;
  size?: string;
  artisan?: string;
  inStock?: boolean;
}
