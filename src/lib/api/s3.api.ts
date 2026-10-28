import axios from "axios";

// const API_BASE_URL = "http://localhost:3000/api/upload";
const API_BASE_URL = `${(import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\\/+$/, "")}/upload`;

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
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    if (uploadType) formData.append("uploadType", uploadType);

    const response = await axios.post(
      `${API_BASE_URL}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  /**
   * Upload multiple files to S3
   */
  async uploadMultiple(files: File[], folder: string = "products") {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("folder", folder);

    const response = await axios.post(
      `${API_BASE_URL}/multiple`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

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

  /** Ask the authenticated backend for a short-lived URL to a private staging object. */
  async getPresignedUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    folder: string = "products",
    uploadType: "product" | "category" | "banner" | "bulk" = "product",
  ): Promise<PresignedUrlResponse> {
    const response = await axios.post<{ data: PresignedUrlResponse }>(
      `${API_BASE_URL}/presigned-url`,
      { fileName, fileType, fileSize, folder, uploadType },
      { headers: this.authHeaders() },
    );
    return response.data.data;
  }

  /** Complete server-side validation/optimization and return the permanent media URL. */
  async finalizeStagedUpload(
    stagingKey: string,
    folder: string,
    uploadType: "product" | "category" | "banner" | "bulk",
  ): Promise<FinalizedUploadResponse> {
    const response = await axios.post<FinalizedUploadResponse>(
      `${API_BASE_URL}/finalize`,
      { stagingKey, folder, uploadType },
      { headers: this.authHeaders() },
    );
    return response.data;
  }

  /** Upload bytes directly to S3, then finalize through the trusted backend pipeline. */
  async uploadDirect(
    file: File,
    folder: string,
    uploadType: "product" | "category" | "banner" | "bulk",
    onProgress?: (percent: number) => void,
  ): Promise<FinalizedUploadResponse> {
    const staged = await this.getPresignedUrl(file.name, file.type, file.size, folder, uploadType);
    await axios.put(staged.uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    });
    return this.finalizeStagedUpload(staged.stagingKey, folder, uploadType);
  }
}


export const s3Api = new S3Api();
