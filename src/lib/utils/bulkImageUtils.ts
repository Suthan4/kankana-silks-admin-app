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
  // A matched Drive proxy URL points to the original. Use the separate
  // thumbnail endpoint for the grid to avoid loading 40+ MB originals.
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

  // 1. If a valid external or blob/data thumbnailUrl is provided, prioritize it
  if (thumbnailUrl && typeof thumbnailUrl === "string") {
    const trimmedThumb = thumbnailUrl.trim();
    if (
      trimmedThumb.startsWith("http://") ||
      trimmedThumb.startsWith("https://") ||
      trimmedThumb.startsWith("data:") ||
      trimmedThumb.startsWith("blob:") ||
      trimmedThumb.startsWith("/")
    ) {
      // Check if it's a private Google Drive web link that won't load in <img>
      const driveId = extractDriveFileId(trimmedThumb);
      if (driveId && getDriveProxyUrl && trimmedThumb.includes("drive.google.com")) {
        return getDriveProxyUrl(driveId);
      }
      return trimmedThumb;
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

  // Create lookup maps for fast matching
  // 1. Map by productGroupId
  const byGroup = new Map<string, typeof matches.matched>();
  // 2. Map by variantSku
  const byVariantSku = new Map<string, typeof matches.matched>();
  // 3. Map by reference filename / URL
  const byReference = new Map<string, typeof matches.matched[0]>();

  for (const entry of matches.matched) {
    if (entry.productGroupId) {
      const list = byGroup.get(entry.productGroupId) || [];
      list.push(entry);
      byGroup.set(entry.productGroupId, list);
    }
    if (entry.variantSku) {
      const list = byVariantSku.get(entry.variantSku) || [];
      list.push(entry);
      byVariantSku.set(entry.variantSku, list);
    }
    if (entry.reference) {
      const refKey = entry.reference.toLowerCase().trim();
      byReference.set(refKey, entry);
      // Also index by base name (without extension)
      const refBase = stripExtension(refKey);
      if (refBase !== refKey) byReference.set(refBase, entry);
    }
    if (entry.file?.name) {
      const nameKey = entry.file.name.toLowerCase().trim();
      byReference.set(nameKey, entry);
      // Also index by base name
      const nameBase = stripExtension(nameKey);
      if (nameBase !== nameKey) byReference.set(nameBase, entry);
    }
  }

  return products.map((product) => {
    const groupMatches = byGroup.get(product.productGroupId) || [];

    // 1. Update product-level media
    const existingMedia = product.media || [];
    let updatedProductMedia: BulkParsedMedia[] = [];

    if (existingMedia.length > 0) {
      updatedProductMedia = existingMedia.map((m, idx) => {
        // Find matching drive entry by reference filename, order index, or group match
        const refMatch =
          (m.url ? byReference.get(m.url.toLowerCase().trim()) : null) ||
          groupMatches.find(
            (gm) =>
              !gm.variantSku &&
              (gm.mediaIndex === m.order || gm.mediaIndex === idx || gm.reference === m.url)
          );

        if (refMatch?.file) {
          const proxyUrl = getDriveProxyUrl(refMatch.file.id);
          const thumbnailUrl = getDriveThumbnailUrl?.(refMatch.file.id) || refMatch.file.thumbnailLink || proxyUrl;
          return {
            ...m,
            url: proxyUrl,
            thumbnailUrl,
            key: refMatch.file.id,
            source: "product" as const,
            productGroupId: product.productGroupId,
            altText: m.altText || refMatch.file.name,
            title: m.title || refMatch.file.name,
          };
        }
        return m;
      });
    } else {
      // If product had no media entries, create entries from groupMatches that don't belong to a variant
      const unassignedGroupMatches = groupMatches.filter((gm) => !gm.variantSku);
      if (unassignedGroupMatches.length > 0) {
        updatedProductMedia = unassignedGroupMatches.map((gm, idx) => {
          const proxyUrl = getDriveProxyUrl(gm.file.id);
          const thumbnailUrl = getDriveThumbnailUrl?.(gm.file.id) || gm.file.thumbnailLink || proxyUrl;
          return {
            type: "IMAGE" as const,
            url: proxyUrl,
            thumbnailUrl,
            key: gm.file.id,
            source: "product" as const,
            productGroupId: product.productGroupId,
            altText: gm.file.name,
            title: gm.file.name,
            order: idx,
            isActive: true,
          };
        });
      }
    }

    // 2. Update variants and their variant-level media
    const updatedVariants = product.variants?.map((v) => {
      const vSku = v.sku?.toLowerCase().trim();
      const variantMatches = (vSku ? byVariantSku.get(vSku) : null) || [];
      const existingVMedia = v.media || [];
      let updatedVMedia: BulkParsedMedia[] = [];

      if (existingVMedia.length > 0) {
        updatedVMedia = existingVMedia.map((m, idx) => {
          const refMatch =
            (m.url ? byReference.get(m.url.toLowerCase().trim()) : null) ||
            variantMatches.find(
              (vm) => vm.mediaIndex === m.order || vm.mediaIndex === idx || vm.reference === m.url
            );

          if (refMatch?.file) {
            const proxyUrl = getDriveProxyUrl(refMatch.file.id);
            const thumbnailUrl = getDriveThumbnailUrl?.(refMatch.file.id) || refMatch.file.thumbnailLink || proxyUrl;
            return {
              ...m,
              url: proxyUrl,
              thumbnailUrl,
              key: refMatch.file.id,
              source: "variant" as const,
              variantSku: v.sku,
              productGroupId: product.productGroupId,
              altText: m.altText || refMatch.file.name,
              title: m.title || refMatch.file.name,
            };
          }
          return m;
        });
      } else if (variantMatches.length > 0) {
        updatedVMedia = variantMatches.map((vm, idx) => {
          const proxyUrl = getDriveProxyUrl(vm.file.id);
          const thumbnailUrl = getDriveThumbnailUrl?.(vm.file.id) || vm.file.thumbnailLink || proxyUrl;
          return {
            type: "IMAGE" as const,
            url: proxyUrl,
            thumbnailUrl,
            key: vm.file.id,
            source: "variant" as const,
            variantSku: v.sku,
            productGroupId: product.productGroupId,
            altText: vm.file.name,
            title: vm.file.name,
            order: idx,
            isActive: true,
          };
        });
      }

      return {
        ...v,
        media: updatedVMedia.length > 0 ? updatedVMedia : v.media,
      };
    });

    // 3. Rebuild unified allImages
    const unifiedAllImages: BulkParsedMedia[] = [
      ...updatedProductMedia.map((m, idx) => ({
        ...m,
        source: "product" as const,
        order: m.order ?? idx,
      })),
      ...(updatedVariants || []).flatMap((v) =>
        (v.media || []).map((m, idx) => ({
          ...m,
          source: "variant" as const,
          variantSku: v.sku,
          order: m.order ?? (100 + idx),
        }))
      ),
    ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return {
      ...product,
      media: updatedProductMedia.length > 0 ? updatedProductMedia : product.media,
      variants: updatedVariants,
      allImages: unifiedAllImages.length > 0 ? unifiedAllImages : product.allImages,
    };
  });
}

