/**
 * mediaUploadService.ts
 *
 * Provides upload helpers for S3/storage and local blob preview helpers.
 * Media files are kept locally as previews until the user clicks "Publish Product",
 * at which point uploadFileToS3() is called to upload and get the public URL.
 */
import { s3Api } from "@/lib/api/s3.api";

export type UploadStatus = "idle" | "pending" | "uploading" | "done" | "error";

export interface MediaPreviewEntry {
  id: string;
  file: File | null;
  localUrl: string;
  publicUrl?: string;
  type: "IMAGE" | "VIDEO";
  status: UploadStatus;
  progress?: number;
  isPrimary: boolean;
  altText?: string;
}

export interface MediaPreviewItem {
  id?: string;
  file?: File | null;
  url: string;
  preview?: string;
  type?: "IMAGE" | "VIDEO";
  order?: number;
  altText?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

/**
 * Upload a single File to S3 and return its public URL.
 * Handles both flat responses `{ success, url, key }` and nested `{ success, data: { url } }`.
 */
export async function uploadFileToS3(
  file: File,
  folder: string = "products",
): Promise<string> {
  const res: any = await s3Api.uploadSingle(file, folder);

  const url =
    res?.url ||
    res?.data?.url ||
    (typeof res?.data === "string" ? res.data : "") ||
    (typeof res === "string" ? res : "");

  if (!url) {
    throw new Error(`Failed to upload ${file.name}: No URL returned from server`);
  }

  return url;
}

/**
 * Create a local preview item from a File.
 * Does NOT perform any network upload.
 */
export function createLocalPreviewItem(
  file: File,
  order: number = 0,
  isPrimary: boolean = false,
  altText?: string,
): MediaPreviewItem {
  const previewUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");

  return {
    id: crypto.randomUUID(),
    file,
    url: previewUrl,
    preview: previewUrl,
    type: isVideo ? "VIDEO" : "IMAGE",
    order,
    isPrimary,
    isActive: true,
    altText: altText || file.name,
  };
}

/**
 * Safely revoke a blob URL to prevent memory leaks.
 */
export function revokePreviewUrl(url?: string): void {
  if (url && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }
}
