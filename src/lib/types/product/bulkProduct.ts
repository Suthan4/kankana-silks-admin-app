export interface BulkCategoryNode {
  id: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  isLeaf: boolean;
  isActive: boolean;
  parentId?: string | null;
  children: BulkCategoryNode[];
}

export interface BulkCategoryLookup {
  id: string;
  name: string;
  slug: string;
  path: string;
  isActive: boolean;
}

export interface BulkParsedVariant {
  rowNumber?: number;
  sku?: string;
  size?: string;
  color?: string;
  fabric?: string;
  attributes?: Record<string, string>;
  basePrice?: number;
  sellingPrice?: number;
  stock?: {
    warehouseId: string;
    warehouseCode?: string;
    quantity: number;
    lowStockThreshold?: number;
  };
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
  errors?: string[];
}

export interface BulkParsedMedia {
  rowNumber?: number;
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  variantSku?: string;
}

export interface BulkValidationError {
  sheet: "Products" | "Variants" | "SEO" | "Media" | "General";
  row?: number;
  productGroupId?: string;
  field: string;
  message: string;
  fix: string;
  severity: "error" | "warning";
}

export interface BulkParsedProduct {
  rowNumber?: number;
  productGroupId: string;
  name: string;
  categoryPath: string;
  categoryId?: string;
  categoryName?: string;
  productType: "simple" | "variable";
  description: string;
  sku?: string;
  basePrice: number;
  sellingPrice: number;
  stock?: {
    warehouseId: string;
    warehouseCode?: string;
    quantity: number;
    lowStockThreshold?: number;
  };
  hsnCode?: string;
  artisanName?: string;
  artisanAbout?: string;
  artisanLocation?: string;
  weight: number;
  length: number;
  breadth: number;
  height: number;
  allowOutOfStockOrders?: boolean;
  hasVideoConsultation?: boolean;
  videoPurchasingEnabled?: boolean;
  videoConsultationNote?: string;
  isActive?: boolean;
  seo?: {
    metaTitle?: string;
    metaDesc?: string;
    slug?: string;
    schemaMarkup?: string;
  };
  media?: BulkParsedMedia[];
  variants?: BulkParsedVariant[];
  isValid?: boolean;
  errors?: BulkValidationError[];
}

export interface BulkValidationSummary {
  totalProducts: number;
  simpleProducts: number;
  variableProducts: number;
  totalVariants: number;
  totalMedia: number;
  validProducts: number;
  invalidProducts: number;
  errorCount: number;
  warningCount: number;
}

export interface BulkValidationResponse {
  valid: boolean;
  summary: BulkValidationSummary;
  errors: BulkValidationError[];
  products: BulkParsedProduct[];
}

export interface BulkImportItemResult {
  productGroupId: string;
  name: string;
  sku?: string;
  status: "success" | "failed" | "skipped";
  productId?: string;
  error?: string;
}

export interface BulkImportResponse {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: BulkImportItemResult[];
}

