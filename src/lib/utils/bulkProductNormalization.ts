import type {
  BulkParsedProduct,
  BulkParsedVariant,
  BulkParsedMedia,
  BulkValidationError,
  BulkCategoryLookup,
  BulkWarehouse,
} from "../types/product/bulkProduct";

/**
 * Normalizes a category path string for comparison (e.g. "Sarees > Pure Kanchipuram Silks"
 * and "Sarees → Pure Kanchipuram Silks" match).
 */
export function normalizeCategoryPath(path?: string): string {
  if (!path) return "";
  return path
    .replace(/[>→/|]/g, " > ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Resolves a category ID, canonical path, and name from either categoryId or categoryPath.
 */
export function resolveCategory(
  categoryPath?: string,
  categoryId?: string,
  flatCategories?: BulkCategoryLookup[]
): { categoryId?: string; categoryPath: string; categoryName?: string } {
  if (!flatCategories || flatCategories.length === 0) {
    return {
      categoryId: categoryId || undefined,
      categoryPath: categoryPath || "",
      categoryName: undefined,
    };
  }

  // 1. If categoryId is given, look it up directly
  if (categoryId) {
    const foundById = flatCategories.find((c) => c.id === categoryId);
    if (foundById) {
      return {
        categoryId: foundById.id,
        categoryPath: foundById.path,
        categoryName: foundById.name,
      };
    }
  }

  // 2. If categoryPath is given, match normalized paths
  if (categoryPath) {
    const norm = normalizeCategoryPath(categoryPath);
    const foundByPath = flatCategories.find(
      (c) => normalizeCategoryPath(c.path) === norm
    );
    if (foundByPath) {
      return {
        categoryId: foundByPath.id,
        categoryPath: foundByPath.path,
        categoryName: foundByPath.name,
      };
    }

    // Also try matching the last segment (leaf category name)
    const segments = categoryPath.split(/[>→/|]/).map((s) => s.trim().toLowerCase());
    const leafName = segments[segments.length - 1];
    if (leafName) {
      const foundByLeaf = flatCategories.find(
        (c) => c.name.toLowerCase() === leafName
      );
      if (foundByLeaf) {
        return {
          categoryId: foundByLeaf.id,
          categoryPath: foundByLeaf.path,
          categoryName: foundByLeaf.name,
        };
      }
    }
  }

  return {
    categoryId: categoryId || undefined,
    categoryPath: categoryPath || "",
    categoryName: undefined,
  };
}

/**
 * Normalizes a single media object into a type-safe BulkParsedMedia.
 */
export function normalizeMedia(
  raw: any,
  index: number,
  fallbackSource: "product" | "variant" = "product",
  variantSku?: string
): BulkParsedMedia {
  if (typeof raw === "string") {
    return {
      type: "IMAGE",
      url: raw.trim(),
      order: index,
      isActive: true,
      source: fallbackSource,
      variantSku,
    };
  }

  const type = raw.type === "VIDEO" ? "VIDEO" : "IMAGE";
  const url = String(raw.url || raw.link || "").trim();
  const order = typeof raw.order === "number" ? raw.order : index;

  return {
    type,
    url,
    thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl).trim() : undefined,
    altText: raw.altText ? String(raw.altText).trim() : undefined,
    title: raw.title ? String(raw.title).trim() : undefined,
    description: raw.description ? String(raw.description).trim() : undefined,
    order,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    key: raw.key ? String(raw.key).trim() : undefined,
    sourceDriveFileId: raw.sourceDriveFileId
      ? String(raw.sourceDriveFileId).trim()
      : undefined,
    mimeType: raw.mimeType,
    fileSize: typeof raw.fileSize === "number" ? raw.fileSize : undefined,
    duration: typeof raw.duration === "number" ? raw.duration : undefined,
    width: typeof raw.width === "number" ? raw.width : undefined,
    height: typeof raw.height === "number" ? raw.height : undefined,
    source: raw.source || fallbackSource,
    variantSku: raw.variantSku || variantSku,
    productGroupId: raw.productGroupId,
  };
}

/**
 * Normalizes a variant object into a type-safe BulkParsedVariant.
 */
export function normalizeVariant(
  raw: any,
  index: number,
  parentProduct: {
    productGroupId: string;
    basePrice: number;
    sellingPrice: number;
    weight?: number;
    length?: number;
    breadth?: number;
    height?: number;
  },
  warehouses?: BulkWarehouse[]
): BulkParsedVariant {
  const defaultWarehouse = warehouses?.find((w) => w.isDefaultPickup) || warehouses?.[0];
  const sku = raw.sku ? String(raw.sku).trim() : `${parentProduct.productGroupId}-VAR-${index + 1}`;
  const title = raw.title ? String(raw.title).trim() : undefined;

  const basePrice =
    raw.basePrice !== undefined ? Number(raw.basePrice) || 0 : parentProduct.basePrice;
  const sellingPrice =
    raw.sellingPrice !== undefined
      ? Number(raw.sellingPrice) || 0
      : raw.price !== undefined
      ? Number(raw.price) || 0
      : parentProduct.sellingPrice;
  const price =
    raw.price !== undefined
      ? Number(raw.price) || 0
      : sellingPrice;

  // Resolve warehouse info
  let stock: BulkParsedVariant["stock"] = undefined;
  if (raw.stock && typeof raw.stock === "object") {
    const wId = String(raw.stock.warehouseId || defaultWarehouse?.id || "");
    const wCode =
      raw.stock.warehouseCode ||
      warehouses?.find((w) => w.id === wId)?.code ||
      "WH-01";
    stock = {
      warehouseId: wId,
      warehouseCode: wCode,
      quantity: Number(raw.stock.quantity) || 0,
      lowStockThreshold:
        raw.stock.lowStockThreshold !== undefined ? Number(raw.stock.lowStockThreshold) || 0 : 5,
    };
  } else if (raw.quantity !== undefined || raw.stockQuantity !== undefined) {
    stock = {
      warehouseId: defaultWarehouse?.id || "",
      warehouseCode: defaultWarehouse?.code || "WH-01",
      quantity: Number(raw.quantity ?? raw.stockQuantity) || 0,
      lowStockThreshold: 5,
    };
  }

  // Variant media
  const rawMedia: any[] = Array.isArray(raw.media) ? raw.media : [];
  const media: BulkParsedMedia[] = rawMedia
    .map((m: BulkParsedMedia, mIdx: number) => normalizeMedia(m, mIdx, "variant", sku))
    .filter((m: BulkParsedMedia) => m.url);

  // Normalize dynamic attributes
  let attributes = raw.attributes;
  if (!attributes || typeof attributes !== "object") {
    attributes = {};
    if (raw.size) attributes["Size"] = raw.size;
    if (raw.color) attributes["Color"] = raw.color;
    if (raw.fabric) attributes["Fabric"] = raw.fabric;
  }

  return {
    ...raw,
    id: raw.id || undefined,
    rowNumber: typeof raw.rowNumber === "number" ? raw.rowNumber : index + 1,
    sku,
    title,
    size: raw.size ? String(raw.size).trim() : undefined,
    color: raw.color ? String(raw.color).trim() : undefined,
    fabric: raw.fabric ? String(raw.fabric).trim() : undefined,
    attributes,
    basePrice,
    sellingPrice,
    price,
    stock,
    weight: raw.weight !== undefined ? Number(raw.weight) || 0 : parentProduct.weight,
    length: raw.length !== undefined ? Number(raw.length) || 0 : parentProduct.length,
    breadth: raw.breadth !== undefined ? Number(raw.breadth) || 0 : parentProduct.breadth,
    height: raw.height !== undefined ? Number(raw.height) || 0 : parentProduct.height,
    media: media.length > 0 ? media : undefined,
    errors: Array.isArray(raw.errors) ? raw.errors : undefined,
  };
}

/**
 * Normalizes a raw product object into a complete, type-safe BulkParsedProduct.
 * Ensures all 35+ fields are preserved, converted to correct primitive types, and valid.
 */
export function normalizeProduct(
  raw: any,
  flatCategories?: BulkCategoryLookup[],
  warehouses?: BulkWarehouse[],
  index = 0
): BulkParsedProduct {
  if (!raw || typeof raw !== "object") {
    return {
      productGroupId: `PROD-${index + 1}`,
      name: "Unnamed Product",
      categoryPath: "",
      productType: "simple",
      description: "",
      basePrice: 0,
      sellingPrice: 0,
      weight: 0.5,
      length: 10,
      breadth: 10,
      height: 5,
      isValid: false,
      errors: [
        {
          sheet: "Products",
          field: "general",
          message: "Invalid product object format",
          fix: "Ensure product is a valid JSON object",
          severity: "error",
        },
      ],
    };
  }

  const defaultWarehouse = warehouses?.find((w) => w.isDefaultPickup) || warehouses?.[0];

  const productGroupId = String(
    raw.productGroupId || raw.sku || raw.id || `PROD-${index + 1}`
  ).trim();
  const name = String(raw.name || "").trim();
  const productType = raw.productType === "variable" ? "variable" : "simple";
  const description = String(raw.description || name).trim();
  const sku = raw.sku ? String(raw.sku).trim() : undefined;

  // Resolve Category
  const catResolution = resolveCategory(
    raw.categoryPath,
    raw.categoryId,
    flatCategories
  );

  // Numbers
  const basePrice = Number(raw.basePrice) || 0;
  const sellingPrice = Number(raw.sellingPrice) || 0;
  const weight = Number(raw.weight) || 0.5;
  const length = Number(raw.length) || 10;
  const breadth = Number(raw.breadth) || 10;
  const height = Number(raw.height) || 5;

  // Stock
  let stock: BulkParsedProduct["stock"] = undefined;
  if (raw.stock && typeof raw.stock === "object") {
    const wId = String(raw.stock.warehouseId || defaultWarehouse?.id || "");
    const wCode =
      raw.stock.warehouseCode ||
      warehouses?.find((w) => w.id === wId)?.code ||
      "WH-01";
    stock = {
      warehouseId: wId,
      warehouseCode: wCode,
      quantity: Number(raw.stock.quantity) || 0,
      lowStockThreshold:
        raw.stock.lowStockThreshold !== undefined ? Number(raw.stock.lowStockThreshold) || 0 : 5,
    };
  } else if (raw.quantity !== undefined || raw.stockQuantity !== undefined) {
    stock = {
      warehouseId: defaultWarehouse?.id || "",
      warehouseCode: defaultWarehouse?.code || "WH-01",
      quantity: Number(raw.quantity ?? raw.stockQuantity) || 0,
      lowStockThreshold: 5,
    };
  }

  // Specifications
  let specifications: { key: string; value: string }[] | undefined = undefined;
  if (Array.isArray(raw.specifications)) {
    specifications = raw.specifications
      .filter((s: any) => s && (s.key || s.value))
      .map((s: any) => ({
        key: String(s.key || "").trim(),
        value: String(s.value || "").trim(),
      }));
  } else if (raw.specifications && typeof raw.specifications === "object") {
    specifications = Object.entries(raw.specifications).map(([key, value]) => ({
      key: String(key).trim(),
      value: String(value || "").trim(),
    }));
  }

  // SEO
  const metaTitle = raw.seo?.metaTitle || raw.metaTitle || undefined;
  const metaDesc = raw.seo?.metaDesc || raw.metaDesc || undefined;
  const slug = raw.seo?.slug || raw.slug || undefined;
  const schemaMarkup = raw.seo?.schemaMarkup || raw.schemaMarkup || undefined;

  const seo =
    metaTitle || metaDesc || slug || schemaMarkup
      ? {
          metaTitle: metaTitle ? String(metaTitle).trim() : undefined,
          metaDesc: metaDesc ? String(metaDesc).trim() : undefined,
          slug: slug ? String(slug).trim() : undefined,
          schemaMarkup: schemaMarkup ? String(schemaMarkup).trim() : undefined,
        }
      : undefined;

  // Product-level media
  const rawMedia = Array.isArray(raw.media) ? raw.media : [];
  const media = rawMedia
    .map((m: any, mIdx: number) => normalizeMedia(m, mIdx, "product"))
    .filter((m: BulkParsedMedia) => m.url);

  // Variants (if variable product)
  let variants: BulkParsedVariant[] | undefined = undefined;
  if (productType === "variable" && Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants.map((v: any, vIdx: number) =>
      normalizeVariant(
        v,
        vIdx,
        {
          productGroupId,
          basePrice,
          sellingPrice,
          weight,
          length,
          breadth,
          height,
        },
        warehouses
      )
    );
  }

  // Build unified allImages
  const allImages: BulkParsedMedia[] = [
    ...media.map((m: BulkParsedMedia, idx: number) => ({ ...m, source: "product" as const, order: m.order ?? idx })),
    ...(variants || []).flatMap((v) =>
      (v.media || []).map((m, idx) => ({
        ...m,
        source: "variant" as const,
        variantSku: v.sku,
        order: m.order ?? (100 + idx),
      }))
    ),
  ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Build complete normalized product preserving unknown fields
  const normalized: BulkParsedProduct = {
    ...raw,
    id: raw.id || undefined,
    rowNumber: typeof raw.rowNumber === "number" ? raw.rowNumber : index + 1,
    productGroupId,
    name,
    categoryPath: catResolution.categoryPath,
    categoryId: catResolution.categoryId,
    categoryName: catResolution.categoryName || raw.categoryName,
    productType,
    description,
    sku,
    basePrice,
    sellingPrice,
    stock,
    hsnCode: raw.hsnCode ? String(raw.hsnCode).trim() : undefined,
    artisanName: raw.artisanName ? String(raw.artisanName).trim() : undefined,
    artisanAbout: raw.artisanAbout ? String(raw.artisanAbout).trim() : undefined,
    artisanLocation: raw.artisanLocation ? String(raw.artisanLocation).trim() : undefined,
    weight,
    length,
    breadth,
    height,
    allowOutOfStockOrders: Boolean(raw.allowOutOfStockOrders),
    hasVideoConsultation: Boolean(raw.hasVideoConsultation),
    videoPurchasingEnabled: Boolean(raw.videoPurchasingEnabled),
    videoConsultationNote: raw.videoConsultationNote ? String(raw.videoConsultationNote).trim() : undefined,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    specifications: specifications && specifications.length > 0 ? specifications : undefined,
    metaTitle: metaTitle ? String(metaTitle).trim() : undefined,
    metaDesc: metaDesc ? String(metaDesc).trim() : undefined,
    seo,
    media: media.length > 0 ? media : undefined,
    allImages: allImages.length > 0 ? allImages : undefined,
    variants,
    importNote: raw.importNote ? String(raw.importNote).trim() : undefined,
    groupSuggestion: raw.groupSuggestion ? String(raw.groupSuggestion).trim() : undefined,
  };

  return normalized;
}

/**
 * Validates a single product against business rules and category requirements.
 * Returns a list of validation errors.
 */
export function validateBulkProduct(
  product: BulkParsedProduct,
  flatCategories?: BulkCategoryLookup[],
  _warehouses?: BulkWarehouse[]
): BulkValidationError[] {
  const errors: BulkValidationError[] = [];
  const gid = product.productGroupId;

  if (!product.productGroupId?.trim()) {
    errors.push({
      sheet: "Products",
      productGroupId: gid,
      field: "productGroupId",
      message: "Product Group ID is required",
      fix: "Provide a unique group ID (e.g. KSS-001)",
      severity: "error",
    });
  }

  if (!product.name?.trim()) {
    errors.push({
      sheet: "Products",
      productGroupId: gid,
      field: "name",
      message: "Product Name is required",
      fix: "Enter a title for the product",
      severity: "error",
    });
  }

  // Category validation
  if (!product.categoryId && !product.categoryPath?.trim()) {
    errors.push({
      sheet: "Products",
      productGroupId: gid,
      field: "categoryId",
      message: "Category is required",
      fix: "Select an existing category from the dropdown",
      severity: "error",
    });
  } else if (flatCategories && flatCategories.length > 0) {
    const hasMatch =
      (product.categoryId && flatCategories.some((c) => c.id === product.categoryId)) ||
      (product.categoryPath &&
        flatCategories.some(
          (c) => normalizeCategoryPath(c.path) === normalizeCategoryPath(product.categoryPath)
        ));

    if (!hasMatch) {
      errors.push({
        sheet: "Products",
        productGroupId: gid,
        field: "categoryPath",
        message: `Category not found: "${product.categoryPath || product.categoryId}"`,
        fix: "Assign a valid category from the system categories",
        severity: "error",
      });
    }
  }

  // Pricing
  if (product.basePrice <= 0) {
    errors.push({
      sheet: "Products",
      productGroupId: gid,
      field: "basePrice",
      message: "Base Price (MRP) must be greater than 0",
      fix: "Enter a positive base price",
      severity: "error",
    });
  }

  if (product.sellingPrice <= 0) {
    errors.push({
      sheet: "Products",
      productGroupId: gid,
      field: "sellingPrice",
      message: "Selling Price must be greater than 0",
      fix: "Enter a positive selling price",
      severity: "error",
    });
  }

  if (product.sellingPrice > product.basePrice && product.basePrice > 0) {
    errors.push({
      sheet: "Products",
      productGroupId: gid,
      field: "sellingPrice",
      message: `Selling price (₹${product.sellingPrice}) cannot exceed base price (₹${product.basePrice})`,
      fix: "Adjust selling price to be less than or equal to MRP",
      severity: "warning",
    });
  }

  // Simple product stock
  if (product.productType === "simple") {
    if (!product.stock) {
      errors.push({
        sheet: "Products",
        productGroupId: gid,
        field: "stock",
        message: "Inventory information is required for simple products",
        fix: "Specify warehouse and stock quantity",
        severity: "error",
      });
    } else if (product.stock.quantity < 0) {
      errors.push({
        sheet: "Products",
        productGroupId: gid,
        field: "stock.quantity",
        message: "Stock quantity cannot be negative",
        fix: "Enter 0 or greater for stock quantity",
        severity: "error",
      });
    }
  }

  // Variable product variants
  if (product.productType === "variable") {
    if (!product.variants || product.variants.length === 0) {
      errors.push({
        sheet: "Variants",
        productGroupId: gid,
        field: "variants",
        message: "Variable products must contain at least 1 variant",
        fix: "Add at least one variant with SKU, price, and stock",
        severity: "error",
      });
    } else {
      product.variants.forEach((v, vIdx) => {
        if (!v.sku?.trim()) {
          errors.push({
            sheet: "Variants",
            productGroupId: gid,
            field: `variants[${vIdx}].sku`,
            message: `Variant #${vIdx + 1} is missing a SKU`,
            fix: "Enter a unique variant SKU",
            severity: "error",
          });
        }
        if (v.sellingPrice !== undefined && v.sellingPrice <= 0) {
          errors.push({
            sheet: "Variants",
            productGroupId: gid,
            field: `variants[${vIdx}].sellingPrice`,
            message: `Variant #${vIdx + 1} price must be greater than 0`,
            fix: "Enter a valid positive price",
            severity: "error",
          });
        }
      });
    }
  }

  return errors;
}

/**
 * Normalizes an array of raw products, resolves categories, recalculates validation errors,
 * and sets isValid property.
 */
export function normalizeProducts(
  rawList: any[],
  flatCategories?: BulkCategoryLookup[],
  warehouses?: BulkWarehouse[]
): BulkParsedProduct[] {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((raw, idx) => {
    const product = normalizeProduct(raw, flatCategories, warehouses, idx);
    const validationErrors = validateBulkProduct(product, flatCategories, warehouses);
    const hasBlockingError = validationErrors.some((e) => e.severity === "error");

    return {
      ...product,
      isValid: !hasBlockingError,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
    };
  });
}

