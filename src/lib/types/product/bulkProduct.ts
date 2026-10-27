export interface BulkWarehouse {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  isDefaultPickup: boolean;
}

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
  /** Present when editing an existing variant (update flow) */
  id?: string;
  sku?: string;
  /** Display title for the variant (e.g. "Red — Free Size") */
  title?: string;
  /** Variant-level price override */
  price?: number;
  size?: string;
  color?: string;
  fabric?: string;
  attributes?: Record<string, string> | Array<{ name: string; value: string }>;
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
  media?: BulkParsedMedia[];
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
  /** "product" for product-level images, "variant" for variant-level images */
  source?: "product" | "variant";
  /** S3 object key (preserved as-is, no re-upload needed). */
  key?: string;
  /** Drive file ID retained as an association after upload, for safe retries/preview edits. */
  sourceDriveFileId?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  productGroupId?: string;
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
  /** Present when editing an existing product (update flow) */
  id?: string;
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
  specifications?: { key: string; value: string }[];
  metaTitle?: string;
  metaDesc?: string;
  seo?: {
    metaTitle?: string;
    metaDesc?: string;
    slug?: string;
    schemaMarkup?: string;
  };
  media?: BulkParsedMedia[];
  /** Unified list of ALL images (product + variant levels) sorted by order. Used for preview. */
  allImages?: BulkParsedMedia[];
  variants?: BulkParsedVariant[];
  importNote?: string;
  groupSuggestion?: string;
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

// ==========================================
// DRAFT & JOB TYPES (Persistent Bulk Import)
// ==========================================

export type DraftStatus =
  | "DRAFT"
  | "READY_FOR_IMPORT"
  | "IMPORTING"
  | "COMPLETED"
  | "FAILED";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  thumbnailLink?: string;
  /** Backend authenticated proxy URL for previewing the file. */
  previewUrl?: string;
  webContentLink?: string;
  webViewLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

export interface MatchedEntry {
  reference: string;
  file: DriveFile;
  mediaIndex: number;
  productGroupId?: string;
  variantSku?: string;
}

export interface MissingEntry {
  reference: string;
  mediaIndex: number;
  productGroupId?: string;
  variantSku?: string;
}

export interface AmbiguousEntry {
  reference: string;
  candidates: DriveFile[];
  mediaIndex: number;
  productGroupId?: string;
  variantSku?: string;
}

export interface DuplicateEntry {
  reference: string;
  mediaIndex: number;
  productGroupId?: string;
  variantSku?: string;
}

export interface ImageMatchResult {
  matched: MatchedEntry[];
  missing: MissingEntry[];
  ambiguous: AmbiguousEntry[];
  duplicates: DuplicateEntry[];
  totalMedia: number;
}

export interface BulkImportDraft {
  id: string;
  status: DraftStatus;
  rawInput: string;
  parsedData: BulkParsedProduct[] | BulkValidationResponse | any;
  imageMatches: ImageMatchResult | null;
  confirmedAssignments: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface BulkImportJobItemResult {
  productGroupId: string;
  name: string;
  sku?: string;
  status: "success" | "failed" | "skipped";
  productId?: string;
  error?: string;
}

export type BulkImportJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type BulkImportJobStage =
  | "preparing_images"
  | "uploading_images"
  | "images_failed"
  | "importing_products"
  | "completed"
  | "failed";

export interface BulkImportImageResult {
  fileId: string;
  name: string;
  status: "success" | "failed";
  url?: string;
  key?: string;
  error?: string;
}

export interface BulkImportJob {
  /** Backend identifier (the API also aliases this to jobId). */
  id?: string;
  jobId: string;
  draftId: string;
  status: BulkImportJobStatus;
  stage?: BulkImportJobStage;
  progress: number;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped?: number;
  results: BulkImportJobItemResult[];
  imagesTotal?: number;
  imagesProcessed?: number;
  imagesUploaded?: number;
  imagesFailed?: number;
  currentFile?: string;
  imageResults?: BulkImportImageResult[];
  error?: string;
  startedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

