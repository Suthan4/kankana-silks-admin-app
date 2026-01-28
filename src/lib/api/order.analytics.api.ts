import { apiCall } from "./api.base.service";

export interface OrderAnalytics {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  revenueByStatus: {
    status: string;
    revenue: number;
    count: number;
  }[];
  recentOrders: any[];
  monthlyTrends: {
    month: string;
    orders: number;
    revenue: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface OrderStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  total: number;
  pending: number;
  cancelledToday: number;
}

export const orderAnalyticsApi = {
  /**
   * Get comprehensive order analytics
   */
  getAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const query = queryParams.toString();
    return apiCall(
      "GET",
      `/admin/orders/analytics${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get order statistics summary
   */
  getStats: async () => {
    return apiCall("GET", "/admin/orders/stats");
  },
};