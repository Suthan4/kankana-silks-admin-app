import { apiCall, type ApiResponse } from "@/lib/api/api.base.service";
import type {
  Consultation,
  CreateConsultationData,
  UpdateConsultationStatusData,
  QueryConsultationParams,
} from "../types/consultation/consultation";

// Consultation API
export const consultationApi = {
  // User endpoints
  createConsultation: async (
    data: CreateConsultationData
  ): Promise<ApiResponse<Consultation>> => {
    return apiCall("POST", "/consultations", data);
  },

  getUserConsultations: async (
    params?: QueryConsultationParams
  ): Promise<
    ApiResponse<{
      consultations: Consultation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/consultations/my-consultations", undefined, {
      params,
    });
  },

  getConsultation: async (id: string): Promise<ApiResponse<Consultation>> => {
    return apiCall("GET", `/consultations/${id}`);
  },

  cancelConsultation: async (
    id: string
  ): Promise<ApiResponse<Consultation>> => {
    return apiCall("POST", `/consultations/${id}/cancel`);
  },

  // Admin endpoints
  getAllConsultations: async (
    params?: QueryConsultationParams
  ): Promise<
    ApiResponse<{
      consultations: Consultation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/admin/consultations", undefined, { params });
  },

  getAdminConsultation: async (
    id: string
  ): Promise<ApiResponse<Consultation>> => {
    return apiCall("GET", `/admin/consultations/${id}`);
  },

  updateConsultationStatus: async (
    id: string,
    data: UpdateConsultationStatusData
  ): Promise<ApiResponse<Consultation>> => {
    return apiCall("PUT", `/admin/consultations/${id}/status`, data);
  },
};
