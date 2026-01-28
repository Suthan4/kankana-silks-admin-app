import React, { useEffect } from "react";
import { useAuth } from "@/context/auth.context";
import { MainLayout } from "@/components/layouts/mainLayout";
import { useQuery } from "@tanstack/react-query";
import { orderAnalyticsApi } from "@/lib/api/order.analytics.api";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  TrendingDown,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch order analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["order-analytics"],
    queryFn: () => orderAnalyticsApi.getAnalytics(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch order stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["order-stats"],
    queryFn: () => orderAnalyticsApi.getStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
console.log("analyticsData", analyticsData);

  const analytics = analyticsData?.data || {};
  const stats = statsData?.data || {};

  const isLoading = isLoadingAnalytics || isLoadingStats;

  const statsCards = [
    {
      label: "Total Orders",
      value: analytics?.overview.totalOrders.toString() || "0",
      icon: <ShoppingCart className="h-6 w-6" />,
      color: "blue",
      change: `${stats?.today || 0} today`,
      visible: true,
    },
    {
      label: "Total Revenue",
      value: `₹${analytics?.overview.totalRevenue.toFixed(2) || "0"}`,
      icon: <IndianRupee className="h-6 w-6" />,
      color: "green",
      change: `Avg: ₹${analytics?.overview.averageOrderValue.toFixed(2) || "0"}`,
      visible: user?.role === "SUPER_ADMIN", // Only super admin sees revenue
    },
    {
      label: "Pending Orders",
      value: analytics?.overview.pendingOrders.toString() || "0",
      icon: <Clock className="h-6 w-6" />,
      color: "yellow",
      change: `${analytics?.overview.processingOrders || 0} processing`,
      visible: true,
    },
    {
      label: "Shipped Orders",
      value: analytics?.overview.shippedOrders.toString() || "0",
      icon: <Truck className="h-6 w-6" />,
      color: "purple",
      change: `${analytics?.overview.deliveredOrders || 0} delivered`,
      visible: true,
    },
    {
      label: "Cancelled Orders",
      value: analytics?.overview.cancelledOrders.toString() || "0",
      icon: <XCircle className="h-6 w-6" />,
      color: "red",
      change: `${stats?.cancelledToday || 0} today`,
      visible: true,
    },
    {
      label: "This Month",
      value: stats?.thisMonth.toString() || "0",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "indigo",
      change: `${stats?.thisWeek || 0} this week`,
      visible: true,
    },
  ].filter((stat) => stat.visible);

  // Prepare chart data
  const statusData =
    analytics?.revenueByStatus.map((item) => ({
      name: item.status,
      orders: item.count,
      revenue: item.revenue,
    })) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <LayoutDashboard className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-100 mt-1">
                  Welcome back, {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
            {isLoading && (
              <RefreshCw className="h-6 w-6 animate-spin text-white/70" />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">{stat.change}</p>
                </div>
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    stat.color === "blue"
                      ? "bg-blue-100 text-blue-600"
                      : stat.color === "green"
                        ? "bg-green-100 text-green-600"
                        : stat.color === "yellow"
                          ? "bg-yellow-100 text-yellow-600"
                          : stat.color === "purple"
                            ? "bg-purple-100 text-purple-600"
                            : stat.color === "red"
                              ? "bg-red-100 text-red-600"
                              : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Order Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.monthlyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Orders"
                />
                {user?.role === "SUPER_ADMIN" && (
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Revenue (₹)"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Orders by Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.orders}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="orders"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        {user?.role === "SUPER_ADMIN" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Selling Products
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity Sold
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics?.topProducts.slice(0, 5).map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {product.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        ₹{product.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Orders
          </h3>
          <div className="space-y-3">
            {analytics?.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.user.firstName} {order.user.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₹{Number(order.total).toFixed(2)}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      order.status === "DELIVERED"
                        ? "bg-green-100 text-green-700"
                        : order.status === "SHIPPED"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "PROCESSING"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/orders"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left block"
            >
              <ShoppingCart className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">View All Orders</h3>
              <p className="text-sm text-gray-500">Manage customer orders</p>
            </a>
            <a
              href="/admin/shipments"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left block"
            >
              <Truck className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Shipments</h3>
              <p className="text-sm text-gray-500">Track and manage shipping</p>
            </a>
            <a
              href="/admin/returns"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left block"
            >
              <RefreshCw className="h-8 w-8 text-orange-600 mb-2" />
              <h3 className="font-medium text-gray-900">Returns</h3>
              <p className="text-sm text-gray-500">Process return requests</p>
            </a>
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Your Role:</strong> {user?.role} | <strong>Email:</strong>{" "}
            {user?.email}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            You have access to admin modules based on your permissions.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};
