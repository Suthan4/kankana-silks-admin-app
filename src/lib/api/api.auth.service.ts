import type { CreateAdminFormData, LoginFormData, RegisterFormData, SetPermissionsFormData } from "../types/user/schema";
import type { LoginResponse, Permission, RegisterResponse, User } from "../types/user/user";
import { apiCall, type ApiResponse, type UsersListResponse } from "./api.base.service";


// Auth API
export const authApi = {
  // Login
  login: async (data: LoginFormData): Promise<any> => {
    return apiCall("POST", "/auth/login", data);
  },

  // Register
  register: async (
    data: RegisterFormData
  ): Promise<ApiResponse<RegisterResponse>> => {
    return apiCall<RegisterResponse>("POST", "/auth/register", data);
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiCall<User>("GET", "/auth/me");
  },

  // Logout
  logout: async (): Promise<ApiResponse<void>> => {
    return apiCall<void>("POST", "/auth/logout");
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    return apiCall<{ accessToken: string }>("POST", "/auth/refresh-token");
  },
};

// Admin User API (Super Admin only)
export const adminUserApi = {
  // Create Admin
  createAdmin: async (
    data: CreateAdminFormData
  ): Promise<ApiResponse<User>> => {
    return apiCall<User>("POST", "/admin/create-admin", data);
  },

  // Set Permissions
  setPermissions: async (
    data: SetPermissionsFormData
  ): Promise<ApiResponse<Permission>> => {
    return apiCall<Permission>("POST", "/admin/set-permissions", data);
  },

  // Get User Permissions
  getUserPermissions: async (
    userId: string
  ): Promise<ApiResponse<Permission[]>> => {
    return apiCall<Permission[]>("GET", `/admin/permissions/${userId}`);
  },

  // List Users
  listUsers: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<UsersListResponse>> => {
    return apiCall<UsersListResponse>("GET", "/admin/users", undefined, {
      params,
    });
  },

  // Update User Role
  updateUserRole: async (
    userId: string,
    role: string
  ): Promise<ApiResponse<User>> => {
    return apiCall<User>("PATCH", `/admin/users/${userId}/role`, { role });
  },

  // Toggle User Status
  toggleUserStatus: async (userId: string): Promise<ApiResponse<User>> => {
    return apiCall<User>("PATCH", `/admin/users/${userId}/toggle-status`);
  },
};
