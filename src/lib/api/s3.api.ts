import axios from "axios";

// const API_BASE_URL = "http://localhost:3000/api/upload";
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/upload`;

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

class S3Api {
  /**
   * Upload a single file to S3
   */
  async uploadSingle(
    file: File,
    folder: string = "products"
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

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
}

export const s3Api = new S3Api();
