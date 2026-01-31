import { apiCall, type ApiResponse } from "./api.base.service";

export interface CreateShipmentRequest {
  orderId: string;
}

export interface AssignCourierRequest {
  orderId: string;
  courierId: number;
}

export interface CheckServiceabilityRequest {
  pickupPincode: string;
  deliveryPincode: string;
}

export interface ShippingRateRequest {
  deliveryPincode: string;
  cod?: boolean;
  weight?: number;
}

export interface GenerateAwbRequest {
  orderId: string;
  courierId: number;
}

// Shipment API
export const shipmentApi = {
  // Public Endpoints
  checkServiceability: async (
    data: CheckServiceabilityRequest
  ): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/shipments/check-serviceability", data);
  },

  trackByTrackingNumber: async (
    trackingNumber: string
  ): Promise<ApiResponse<any>> => {
    return apiCall("GET", `/shipments/track/${trackingNumber}`);
  },

  getShippingRates: async (
    data: ShippingRateRequest
  ): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/shipping/rates", data);
  },

  // User Endpoints
  getShipmentByOrderId: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiCall("GET", `/shipments/order/${orderId}`);
  },

  trackShipment: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiCall("GET", `/shipments/order/${orderId}/track`);
  },

  // Admin Endpoints
  createShipment: async (
    data: CreateShipmentRequest
  ): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/admin/shipments/create", data);
  },

  getAvailableCouriers: async (orderId: string) => {
    return apiCall("GET", `/admin/shipments/couriers/${orderId}`);
  },

  // ✅ NEW: Separate Generate AWB endpoint
  generateAwb: async (
    data: GenerateAwbRequest
  ): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/admin/shipments/generateawb&assign-courier", data);
  },

    // ⚠️ DEPRECATED: Use generateAwb instead
  // assignCourier: async (
  //   data: AssignCourierRequest
  // ): Promise<ApiResponse<any>> => {
  //   return apiCall("POST", "/admin/shipments/assign-courier", data);
  // },

    // ✅ Schedule Pickup (requires AWB to be generated first)
  schedulePickup: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/admin/shipments/schedule-pickup", { orderId });
  },

  // ✅ Generate Label (requires AWB)
  generateLabel: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/admin/shipments/generate-label", { orderId });
  },

  // ✅ Generate Manifest (requires AWB)
  generateManifest: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/admin/shipments/generate-manifest", { orderId });
  },

  markAsDelivered: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/admin/shipments/mark-delivered", { orderId });
  },

  getShiprocketOrderDetails: async (
    orderId: string
  ): Promise<ApiResponse<any>> => {
    return apiCall("GET", `/admin/shipments/shiprocket/${orderId}`);
  },

  createReturnOrder: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/admin/shipments/return", { orderId });
  },

  cancelShipment: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiCall("POST", "/admin/shipments/cancel", { orderId });
  },
};