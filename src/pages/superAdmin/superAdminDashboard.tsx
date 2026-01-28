import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Users,
  Eye,
  EyeOff,
  Shield,
  Activity,
  RotateCcw,
  XCircle,
  Package,
  ShoppingCart,
  IndianRupee,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
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
  AreaChart,
  Area,
} from "recharts";
import { MainLayout } from "@/components/layouts/mainLayout";
import {
  createAdminSchema,
  type CreateAdminFormData,
} from "@/lib/types/user/schema";
import { adminUserApi } from "@/lib/api/api.auth.service";
import type { User } from "@/lib/types/user/user";
import { useAuth } from "@/context/auth.context";
import { SetPermissionsModal } from "@/components/superAdmin/setpermissionsmodal";
import { useNavigate } from "react-router";
import { orderAnalyticsApi } from "@/lib/api/order.analytics.api";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  });

  // Fetch all users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await adminUserApi.listUsers({ page: 1, limit: 50 });
      return response.data;
    },
  });

  // ✅ Fetch order analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["order-analytics"],
    queryFn: () => orderAnalyticsApi.getAnalytics(),
    refetchInterval: 60000, // Refresh every minute
  });

  // ✅ Fetch order stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["order-stats"],
    queryFn: () => orderAnalyticsApi.getStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
console.log("analyticsData", analyticsData);

  const analytics = analyticsData?.data || {};
  const stats = statsData?.data || {};
  const isLoading = isLoadingAnalytics || isLoadingStats;

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: adminUserApi.createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      reset();
    },
  });

  const onSubmit = (data: CreateAdminFormData) => {
    createAdminMutation.mutate(data);
  };

  const handleSetPermissions = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  // Calculate stats from users data
  const totalUsers = usersData?.users.length || 0;
  const totalAdmins =
    usersData?.users.filter((u: User) => u.role === "ADMIN").length || 0;
  const totalSuperAdmins =
    usersData?.users.filter((u: User) => u.role === "SUPER_ADMIN").length || 0;
  const activeUsers =
    usersData?.users.filter((u: User) => u.isActive).length || 0;

  const displayedUsers = usersData?.users.slice(0, 4) || [];
  const hasMoreUsers = totalUsers > 4;

  // ✅ Stats configuration with REAL DATA
  const statsCards = [
    // User Management Stats
    {
      label: "Total Users",
      value: totalUsers.toString(),
      icon: <Users className="h-6 w-6" />,
      color: "blue",
      change: `${activeUsers} active`,
      changeType: "neutral",
      visible: true,
    },
    {
      label: "Total Admins",
      value: totalAdmins.toString(),
      icon: <Shield className="h-6 w-6" />,
      color: "purple",
      change: `${totalSuperAdmins} super admins`,
      changeType: "neutral",
      visible: true,
    },
    // ✅ Real Order Stats
    {
      label: "Total Orders",
      value: analytics?.overview.totalOrders.toString() || "0",
      icon: <ShoppingCart className="h-6 w-6" />,
      color: "green",
      change: `${stats?.today || 0} today`,
      changeType: "positive",
      visible: true,
    },
    {
      label: "Total Revenue",
      value: `₹${analytics?.overview.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 }) || "0"}`,
      icon: <IndianRupee className="h-6 w-6" />,
      color: "emerald",
      change: `Avg: ₹${analytics?.overview.averageOrderValue.toFixed(0) || "0"}`,
      changeType: "positive",
      visible: true,
    },
    {
      label: "Pending Orders",
      value: analytics?.overview.pendingOrders.toString() || "0",
      icon: <Package className="h-6 w-6" />,
      color: "yellow",
      change: `${analytics?.overview.processingOrders || 0} processing`,
      changeType: "neutral",
      visible: true,
    },
    {
      label: "Delivered Orders",
      value: analytics?.overview.deliveredOrders.toString() || "0",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "indigo",
      change: `${analytics?.overview.shippedOrders || 0} in transit`,
      changeType: "positive",
      visible: true,
    },
    {
      label: "Cancellations",
      value: analytics?.overview.cancelledOrders.toString() || "0",
      icon: <XCircle className="h-6 w-6" />,
      color: "red",
      change: `${stats?.cancelledToday || 0} today`,
      changeType: "negative",
      visible: true,
    },
    {
      label: "This Month",
      value: stats?.thisMonth.toString() || "0",
      icon: <Activity className="h-6 w-6" />,
      color: "teal",
      change: `${stats?.thisWeek || 0} this week`,
      changeType: "positive",
      visible: true,
    },
  ].filter((stat) => stat.visible);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <UserPlus className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Super Admin Panel</h1>
                <p className="text-purple-100 mt-1">
                  Complete system overview and administration
                </p>
              </div>
            </div>
            {isLoading && (
              <RefreshCw className="h-6 w-6 animate-spin text-white/70" />
            )}
          </div>
        </div>

        {/* Stats Grid - Comprehensive Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <p
                    className={`text-sm mt-1 ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    stat.color === "blue"
                      ? "bg-blue-100 text-blue-600"
                      : stat.color === "purple"
                        ? "bg-purple-100 text-purple-600"
                        : stat.color === "green"
                          ? "bg-green-100 text-green-600"
                          : stat.color === "indigo"
                            ? "bg-indigo-100 text-indigo-600"
                            : stat.color === "emerald"
                              ? "bg-emerald-100 text-emerald-600"
                              : stat.color === "orange"
                                ? "bg-orange-100 text-orange-600"
                                : stat.color === "red"
                                  ? "bg-red-100 text-red-600"
                                  : stat.color === "yellow"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : "bg-teal-100 text-teal-600"
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
          {/* Revenue & Orders Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Monthly Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue (₹)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Selling Products
            </h3>
            <div className="space-y-3">
              {analytics?.topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {product.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.quantity} units sold
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">
                    ₹{product.revenue.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Admin Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <UserPlus className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Create Admin
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {createAdminMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {(createAdminMutation.error as any)?.message ||
                    "Failed to create admin"}
                </div>
              )}

              {createAdminMutation.isSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  Admin created successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    {...register("firstName")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    {...register("lastName")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (optional)
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9876543210"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={createAdminMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
            </div>

            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {displayedUsers?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            user.role === "SUPER_ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : user.role === "ADMIN"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    {user.role === "ADMIN" && (
                      <button
                        onClick={() => handleSetPermissions(user)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Set Permissions
                      </button>
                    )}
                  </div>
                ))}
                {hasMoreUsers && (
                  <button
                    onClick={() => navigate("/admin/user-management")}
                    className="w-full py-3 text-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    View All {totalUsers} Users
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h3>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
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
                    ₹{Number(order.total).toLocaleString("en-IN")}
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
      </div>

      {/* Set Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <SetPermissionsModal
          user={selectedUser}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </MainLayout>
  );
}
