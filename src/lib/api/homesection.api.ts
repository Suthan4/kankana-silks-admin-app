import type {
  CreateHomeSectionData,
  HomeSection,
  QueryHomeSectionParams,
  UpdateHomeSectionData,
} from "../types/heroSection/herosection";
import { apiCall, type ApiResponse } from "./api.base.service";

// API functions
export const homeSectionApi = {
  // Get all home sections
  getHomeSections: (
    params?: QueryHomeSectionParams
  ): Promise<
    ApiResponse<{
      sections: HomeSection[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    return apiCall("GET", "/home-sections", {
      params,
    });
  },

  // Get active sections (public)
  getActiveSections: (): Promise<ApiResponse<HomeSection[]>> => {
    return apiCall("GET", "/home-sections/active");
  },

  // Get single section
  getHomeSection: (id: string): Promise<ApiResponse<HomeSection>> => {
    return apiCall("GET", `/home-sections/${id}`);
  },

  // Create section
  createHomeSection: (data: CreateHomeSectionData) => {
    return apiCall("POST", "/home-sections", data);
  },

  // Update section
  updateHomeSection: (
    id: string,
    data: UpdateHomeSectionData
  ): Promise<ApiResponse<HomeSection>> => {
    return apiCall("PUT", `/home-sections/${id}`, {
      data,
    });
  },

  // Delete section
  deleteHomeSection: (id: string): Promise<ApiResponse<void>> => {
    return apiCall("DELETE", `/home-sections/${id}`);
  },
};
