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
export interface UploadedMediaResult {
  url: string;
  key?: string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  format?: string;
  qualityUsed?: number;
}

export async function uploadFileToS3WithMetadata(
  file: File,
  folder: string = "products",
  uploadType: "product" | "category" | "banner" | "bulk" = "product",
  onProgress?: (percent: number) => void,
): Promise<UploadedMediaResult> {
  // Images use the existing backend multipart S3 endpoint (/api/upload/multiple).
  // This is the same public-bucket optimizer pipeline used by the admin uploader;
  // do not route image uploads through presigned/staging endpoints.
  const res = file.type.startsWith("image/")
    ? await s3Api.uploadMultiple([file], folder, uploadType, onProgress)
    : await s3Api.uploadSingle(file, folder, uploadType);

  const uploadedFile = Array.isArray(res?.files) ? res.files[0] : undefined;
  if (file.type.startsWith("image/") && uploadedFile?.success === false) {
    throw new Error(uploadedFile.error || `Failed to upload ${file.name}.`);
  }

  const metadata = uploadedFile?.result || uploadedFile?.data || uploadedFile;
  const url = metadata?.url || res?.url || res?.data?.url ||
    (typeof res?.data === "string" ? res.data : "") ||
    (typeof res === "string" ? res : "");
  if (!res?.success || !url) {
    throw new Error(res?.message || `Failed to upload ${file.name}: No permanent storage URL returned.`);
  }

  return {
    url,
    key: metadata?.key || res?.key || res?.data?.key,
    size: metadata?.size,
    width: metadata?.width,
    height: metadata?.height,
    mimeType: metadata?.format === "webp" ? "image/webp" : file.type,
    format: metadata?.format,
    qualityUsed: metadata?.qualityUsed,
  };
}

export async function uploadFileToS3(
  file: File,
  folder: string = "products",
  uploadType: "product" | "category" | "banner" | "bulk" = "product",
): Promise<string> {
  return (await uploadFileToS3WithMetadata(file, folder, uploadType)).url;
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
