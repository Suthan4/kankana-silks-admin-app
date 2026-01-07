export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  order: number;
}

export interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  fabric?: string;
  price: number;
  sku: string;
}

export interface Specification {
  id: string;
  key: string;
  value: string;
}

export interface Stock {
  id: string;
  warehouseId: string;
  quantity: number;
  lowStockThreshold: number;
}

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
  images?: ProductImage[];
  variants?: ProductVariant[];
  specifications?: Specification[];
  stock?: Stock[];
  createdAt: string;
  updatedAt: string;
}

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
  images?: Array<{ url: string; altText?: string; order?: number }>;
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
