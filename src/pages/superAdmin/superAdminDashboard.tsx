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
} from "lucide-react";
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

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const navigate = useNavigate();

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

  // Stats configuration - Comprehensive overview for Super Admin
  const stats = [
    // User Management Stats
    {
      label: "Total Users",
      value: totalUsers.toString(),
      icon: <Users className="h-6 w-6" />,
      color: "blue",
      change: `${activeUsers} active`,
      visible: true,
    },
    {
      label: "Total Admins",
      value: totalAdmins.toString(),
      icon: <Shield className="h-6 w-6" />,
      color: "purple",
      change: `${totalSuperAdmins} super admins`,
      visible: true,
    },
    // Business Stats (visible to all in Super Admin dashboard)
    {
      label: "Total Products",
      value: "234",
      icon: <Package className="h-6 w-6" />,
      color: "indigo",
      change: "+12% this month",
      visible: true,
    },
    {
      label: "Total Orders",
      value: "1,234",
      icon: <ShoppingCart className="h-6 w-6" />,
      color: "green",
      change: "+8% this month",
      visible: true,
    },
    {
      label: "Total Revenue",
      value: "₹ 45,678",
      icon: <IndianRupee className="h-6 w-6" />,
      color: "emerald",
      change: "+23% from last month",
      visible: user?.role === "SUPER_ADMIN", // Only SUPER_ADMIN can see revenue
    },
    {
      label: "Pending Returns",
      value: "12",
      icon: <RotateCcw className="h-6 w-6" />,
      color: "orange",
      change: "-5% this month",
      visible: true,
    },
    {
      label: "Cancellations",
      value: "8",
      icon: <XCircle className="h-6 w-6" />,
      color: "red",
      change: "3 today",
      visible: true,
    },
    {
      label: "System Activity",
      value: "99.9%",
      icon: <Activity className="h-6 w-6" />,
      color: "teal",
      change: "Uptime",
      visible: true,
    },
  ].filter((stat) => stat.visible);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Super Admin Panel</h1>
              <p className="text-purple-100 mt-1">
                Manage administrators and permissions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Comprehensive Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
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
                      stat.change.startsWith("+")
                        ? "text-green-600"
                        : stat.change.startsWith("-")
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
                      : "bg-teal-100 text-teal-600"
                  }`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

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
