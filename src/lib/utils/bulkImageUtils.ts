import type {
  BulkParsedProduct,
  BulkParsedMedia,
  ImageMatchResult,
} from "../types/product/bulkProduct";

/**
 * Extracts a Google Drive file ID from a URL, ID string, or share link.
 */
export function extractDriveFileId(input?: string): string | null {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();

  // Pattern 1: /file/d/<id>/
  const m1 = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];

  // Pattern 2: id=<id>
  const m2 = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];

  // Pattern 3: /d/<id>/
  const m3 = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m3) return m3[1];

  // Pattern 4: Google Drive file ID directly (25-50 characters, alphanumeric with _ and -)
  // Ensure it doesn't look like a filename with standard image extension (e.g. .jpg, .png)
  if (/^[a-zA-Z0-9_-]{20,55}$/.test(str) && !/\.(jpg|jpeg|png|webp|gif|avif|bmp|svg)$/i.test(str)) {
    return str;
  }

  return null;
}

/**
 * Resolves a usable browser image URL from a URL, thumbnail, or Google Drive reference.
 */
export function resolveImageUrl(
  url?: string,
  thumbnailUrl?: string,
  getDriveProxyUrl?: (fileId: string) => string | undefined,
  getDriveThumbnailUrl?: (fileId: string) => string | undefined
): string | undefined {
  // Prefer a known thumbnail URL first; Drive match results may expose
  // an already-accessible googleusercontent thumbnail for the selected file.
  // This is small preview data, not the original image content.
  if (thumbnailUrl && typeof thumbnailUrl === "string") {
    const trimmedThumb = thumbnailUrl.trim();
    if (
      trimmedThumb.startsWith("http://") ||
      trimmedThumb.startsWith("https://") ||
      trimmedThumb.startsWith("data:") ||
      trimmedThumb.startsWith("blob:") ||
      trimmedThumb.startsWith("/")
    ) {
      const thumbDriveId = extractDriveFileId(trimmedThumb);
      if (thumbDriveId && getDriveProxyUrl && trimmedThumb.includes("drive.google.com")) {
        return getDriveProxyUrl(thumbDriveId);
      }
      return trimmedThumb;
    }
  }

  // If no known thumbnail URL exists, use the backend's authenticated thumbnail
  // endpoint for URLs that point to Drive originals. Never load the original in a grid.
  if (url && getDriveThumbnailUrl) {
    const proxyMatch = url.match(/\/products\/bulk\/drive-proxy\/([^/?#]+)/);
    if (proxyMatch?.[1]) {
      try {
        return getDriveThumbnailUrl(decodeURIComponent(proxyMatch[1]));
      } catch {
        return getDriveThumbnailUrl(proxyMatch[1]);
      }
    }
  }

  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // 2. Direct external or data/blob URL
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    // If it is a Drive link, extract the file ID and route through the authenticated backend proxy
    const driveId = extractDriveFileId(trimmed);
    if (driveId && getDriveProxyUrl && trimmed.includes("drive.google.com")) {
      return getDriveProxyUrl(driveId);
    }
    return trimmed;
  }

  // 3. Google Drive file ID
  const driveId = extractDriveFileId(trimmed);
  if (driveId && getDriveProxyUrl) {
    return getDriveProxyUrl(driveId);
  }

  // 4. Filename without valid URL (e.g. "kss-001.jpg" or "saree.png")
  // Return undefined so the UI can display a clean placeholder instead of broken <img> tag
  return undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strips file extension if present: "photo.jpg" → "photo" */
function stripExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  if (lastDot > 0) {
    return name.substring(0, lastDot);
  }
  return name;
}

/**
 * Creates a comparable filename key from a raw reference, URL, or Drive filename.
 * Handles the camera-photo naming convention where O and 0 are easily confused.
 */
function normalizeMediaReference(value?: string): string {
  if (!value || typeof value !== "string") return "";

  let name = value.trim();
  try {
    const parsed = new URL(name);
    name = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || name);
  } catch {
    name = name.split(/[?#]/, 1)[0].split(/[\\/]/).pop() || name;
  }

  name = stripExtension(name.normalize("NFKC").trim()).toLocaleLowerCase("en-US");
  const cameraReference = name.match(/^([a-z]{2,5})[o0](\d{4,})$/);
  if (cameraReference) return `${cameraReference[1]}0${cameraReference[2]}`;
  return name;
}

/**
 * Applies matched Google Drive images to the product collection.
 * Updates both product-level and variant-level media with authenticated proxy URLs,
 * preserving metadata, ordering, and existing valid media.
 */
export function applyDriveMatchesToProducts(
  products: BulkParsedProduct[],
  matches: ImageMatchResult,
  getDriveProxyUrl: (fileId: string) => string,
  getDriveThumbnailUrl?: (fileId: string) => string
): BulkParsedProduct[] {
  if (!matches || !Array.isArray(matches.matched) || matches.matched.length === 0) {
    return products;
  }

  const byGroup = new Map<string, typeof matches.matched>();
  const byVariantSku = new Map<string, typeof matches.matched>();
  const byReference = new Map<string, typeof matches.matched[number]>();

  for (const entry of matches.matched) {
    if (entry.productGroupId) {
      const list = byGroup.get(entry.productGroupId) || [];
      list.push(entry);
      byGroup.set(entry.productGroupId, list);
    }
    if (entry.variantSku) {
      const skuKey = entry.variantSku.toLocaleLowerCase("en-US").trim();
      const list = byVariantSku.get(skuKey) || [];
      list.push(entry);
      byVariantSku.set(skuKey, list);
    }

    for (const value of [entry.reference, entry.file?.name]) {
      if (!value) continue;
      const normalizedKey = normalizeMediaReference(value);
      if (normalizedKey) byReference.set(normalizedKey, entry);
    }
  }

  // The backend's mediaIndex is global across products: product media first,
  // followed by that product's variant media. Reconstruct those positions so
  // matched files still attach correctly when a filename string differs.
  let globalMediaCursor = 0;

  return products.map((product) => {
    const productMedia = product.media || [];
    const productMediaStart = globalMediaCursor;
    globalMediaCursor += productMedia.length;

    const variantMediaStarts = new Map<string, number>();
    for (const variant of product.variants || []) {
      const skuKey = (variant.sku || "").toLocaleLowerCase("en-US").trim();
      variantMediaStarts.set(skuKey, globalMediaCursor);
      globalMediaCursor += (variant.media || []).length;
    }

    const groupMatches = byGroup.get(product.productGroupId) || [];

    const updatedProductMedia: BulkParsedMedia[] = productMedia.map((media, index) => {
      const normalizedRef = normalizeMediaReference(media.url);
      const refMatch =
        (normalizedRef ? byReference.get(normalizedRef) : undefined) ||
        groupMatches.find(
          (entry) => !entry.variantSku && entry.mediaIndex === productMediaStart + index
        );

      if (!refMatch?.file) return media;

      const proxyUrl = getDriveProxyUrl(refMatch.file.id);
      return {
        ...media,
        url: proxyUrl,
        thumbnailUrl: getDriveThumbnailUrl?.(refMatch.file.id) || refMatch.file.thumbnailLink || proxyUrl,
        key: refMatch.file.id,
        source: "product" as const,
        productGroupId: product.productGroupId,
        altText: media.altText || refMatch.file.name,
        title: media.title || refMatch.file.name,
      };
    });

    const updatedVariants = (product.variants || []).map((variant) => {
      const skuKey = (variant.sku || "").toLocaleLowerCase("en-US").trim();
      const variantMedia = variant.media || [];
      const variantMediaStart = variantMediaStarts.get(skuKey) ?? productMediaStart + productMedia.length;
      const variantMatches = skuKey ? (byVariantSku.get(skuKey) || []) : [];

      const updatedVariantMedia = variantMedia.map((media, index) => {
        const normalizedRef = normalizeMediaReference(media.url);
        const refMatch =
          (normalizedRef ? byReference.get(normalizedRef) : undefined) ||
          variantMatches.find((entry) => entry.mediaIndex === variantMediaStart + index) ||
          groupMatches.find(
            (entry) => entry.variantSku?.toLocaleLowerCase("en-US").trim() === skuKey &&
              entry.mediaIndex === variantMediaStart + index
          );

        if (!refMatch?.file) return media;

        const proxyUrl = getDriveProxyUrl(refMatch.file.id);
        return {
          ...media,
          url: proxyUrl,
          thumbnailUrl: getDriveThumbnailUrl?.(refMatch.file.id) || refMatch.file.thumbnailLink || proxyUrl,
          key: refMatch.file.id,
          source: "variant" as const,
          variantSku: variant.sku,
          productGroupId: product.productGroupId,
          altText: media.altText || refMatch.file.name,
          title: media.title || refMatch.file.name,
        };
      });

      return {
        ...variant,
        media: updatedVariantMedia,
      };
    });

    const unifiedAllImages: BulkParsedMedia[] = [
      ...updatedProductMedia.map((media, index) => ({
        ...media,
        source: "product" as const,
        order: media.order ?? index,
      })),
      ...updatedVariants.flatMap((variant) =>
        (variant.media || []).map((media, index) => ({
          ...media,
          source: "variant" as const,
          variantSku: variant.sku,
          order: media.order ?? (100 + index),
        }))
      ),
    ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return {
      ...product,
      media: updatedProductMedia,
      variants: updatedVariants,
      allImages: unifiedAllImages.length > 0 ? unifiedAllImages : product.allImages,
    };
  });
}
