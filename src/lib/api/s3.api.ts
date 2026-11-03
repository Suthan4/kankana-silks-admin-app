import axios from "axios";

// const API_BASE_URL = "http://localhost:3000/api/upload";
const API_BASE_URL = `${(import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, "")}/upload`;

export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    key: string;
    bucket: string;
  };
  message: string;
}

export interface MultipleUploadResponse {
  success: boolean;
  files: string[];
  message: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  stagingKey: string;
  expiresIn: number;
}

export interface FinalizedUploadResponse {
  success: boolean;
  url: string;
  key: string;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
  qualityUsed?: number;
  attempts?: number;
}


class S3Api {
  /**
   * Upload a single file to S3
   */
  async uploadSingle(
    file: File,
    folder: string = "products",
    uploadType?: "product" | "category" | "banner" | "bulk",
    onProgress?: (percent: number) => void,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    if (uploadType) formData.append("uploadType", uploadType);

    const response = await axios.post(`${API_BASE_URL}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data;
  }

  /**
   * Upload multiple files to S3
   */
  async uploadMultiple(
    files: File[],
    folder: string = "products",
    uploadType: "product" | "category" | "banner" | "bulk" = "product",
    onProgress?: (percent: number) => void,
  ) {
    if (!files.length) throw new Error("Select at least one file to upload.");
    if (files.length > 10) throw new Error("A maximum of 10 files can be uploaded per request.");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("folder", folder);
    formData.append("uploadType", uploadType);

    const response = await axios.post(`${API_BASE_URL}/multiple`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data;
  }

  /**
   * Delete a single file from S3 by URL
   */
  async deleteFileByUrl(url: string): Promise<DeleteResponse> {
    const response = await axios.delete<DeleteResponse>(`${API_BASE_URL}`, {
      data: { url },
    });

    return response.data;
  }

  /**
   * Delete multiple files from S3 by URLs
   */
  async deleteMultipleFiles(urls: string[]): Promise<DeleteResponse> {
    const response = await axios.delete<DeleteResponse>(
      `${API_BASE_URL}/multiple`,
      {
        data: { urls },
      }
    );

    return response.data;
  }

  private authHeaders() {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Your admin session has expired. Sign in again before uploading.");
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Upload image bytes through the backend's multipart /multiple endpoint.
   * This path uses the configured public media bucket and never requests a
   * presigned URL or private staging bucket.
   */
  async uploadDirect(
    file: File,
    folder: string,
    uploadType: "product" | "category" | "banner" | "bulk",
    onProgress?: (percent: number) => void,
  ): Promise<FinalizedUploadResponse> {
    const response = await this.uploadMultiple([file], folder, uploadType, onProgress);
    const item = Array.isArray(response?.files) ? response.files[0] : undefined;
    const result = item?.result || item?.data || item;
    const url = result?.url || result?.data?.url;

    if (!response?.success || item?.success === false || typeof url !== "string" || !url) {
      throw new Error(
        item?.error || response?.error || response?.message ||
        `Upload failed for ${file.name}: the server did not return a public media URL.`,
      );
    }

    onProgress?.(100);
    return {
      success: true,
      url,
      key: result?.key || result?.data?.key,
      size: result?.size ?? result?.data?.size,
      width: result?.width ?? result?.data?.width,
      height: result?.height ?? result?.data?.height,
      format: result?.format ?? result?.data?.format,
      qualityUsed: result?.qualityUsed ?? result?.data?.qualityUsed,
      attempts: result?.attempts ?? result?.data?.attempts,
    };

  }
}


export const s3Api = new S3Api();
