/**
 * Shared utilities for product form data normalization.
 * Extracted from productsPage.tsx to enable use across product components.
 */

export interface MediaPreviewItem {
  file: File | null;
  preview: string;
  isPrimary: boolean;
  id: string;
  type: "IMAGE" | "VIDEO";
  thumbnailUrl?: string;
}

export type ProductMediaForm = {
  type: "IMAGE" | "VIDEO";
  url: string;
  order: number;
  isActive: boolean;
  altText?: string;
};

export type AttributeField = {
  key: string;
  value: string;
};

// Maximum allowed total media size (400MB)
export const MAX_MEDIA_SIZE = 400 * 1024 * 1024;

/** Format bytes into a human-readable string (B / KB / MB). */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Calculate the combined file size of all product-level and variant-level
 * media previews (only counts items that have an actual File object, i.e.
 * newly selected files, not already-uploaded URLs).
 */
export const calculateTotalMediaSize = (
  mediaPreviews: MediaPreviewItem[],
  variantMediaPreviews: Record<number, MediaPreviewItem[]>,
): number => {
  const productMediaSize = mediaPreviews.reduce(
    (total, item) => total + (item.file?.size || 0),
    0,
  );

  const variantMediaSize = Object.values(variantMediaPreviews).reduce(
    (total, previews) =>
      total + previews.reduce((sum, item) => sum + (item.file?.size || 0), 0),
    0,
  );

  return productMediaSize + variantMediaSize;
};

/**
 * Normalize a variant attribute map from various legacy payload shapes into
 * a plain `Record<string, string>`.
 *
 * Handles shapes where attributes might be:
 * - `variant.attributes` — already a plain object (preferred)
 * - `variant.customAttributes`, `variant.dynamicAttributes`, or
 *   `variant.attributeFields` — array of `{ key, value }` objects
 */
export const normalizeVariantAttributes = (
  variant: any,
): Record<string, string> | undefined => {
  if (
    variant?.attributes &&
    typeof variant.attributes === "object" &&
    !Array.isArray(variant.attributes)
  ) {
    return variant.attributes;
  }

  const arr =
    variant?.customAttributes ??
    variant?.dynamicAttributes ??
    variant?.attributeFields ??
    [];

  if (!Array.isArray(arr)) return undefined;

  const record: Record<string, string> = {};

  for (const row of arr) {
    const k = String(row?.key ?? row?.attribute ?? "").trim();
    const v = String(row?.value ?? "").trim();
    if (k && v) record[k] = v;
  }

  return Object.keys(record).length > 0 ? record : undefined;
};
