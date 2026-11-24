import apiClient from "./api.base.service";

export interface AnalyticsReport {
  range: { startDate: string; endDate: string };
  ga4: {
    propertyId: string;
    rowCount: number;
    rows: Array<Record<string, string | number>>;
  };
  clarity: {
    configured: boolean;
    window?: string;
    data?: Array<{ metricName: string; information?: Array<Record<string, unknown>> }>;
    limitation?: string;
    error?: string;
  };
  notes: string[];
}

export const analyticsApi = {
  getReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<{ success: boolean; data: AnalyticsReport }>(
      "/admin/analytics/report",
      { params: { startDate, endDate } },
    );
    return response.data.data;
  },
  download: async (startDate: string, endDate: string, format: "csv" | "xlsx") => {
    const response = await apiClient.get("/admin/analytics/export", {
      params: { startDate, endDate, format },
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: format === "csv" ? "text/csv;charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kankana-analytics-${startDate}-to-${endDate}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
