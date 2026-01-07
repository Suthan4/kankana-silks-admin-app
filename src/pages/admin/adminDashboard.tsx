import React from "react";
import { useAuth } from "@/context/auth.context";
import { MainLayout } from "@/components/layouts/mainLayout";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      label: "Total Products",
      value: "234",
      icon: <Package className="h-6 w-6" />,
      color: "blue",
      change: "+12%",
      visible: true,
    },
    {
      label: "Total Orders",
      value: "1,234",
      icon: <ShoppingCart className="h-6 w-6" />,
      color: "green",
      change: "+8%",
      visible: true,
    },
    {
      label: "Revenue",
      value: "$45,678",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "purple",
      change: "+23%",
      visible: user?.role === "SUPER_ADMIN",
    }, // Only SUPER_ADMIN
    {
      label: "Pending Returns",
      value: "12",
      icon: <LayoutDashboard className="h-6 w-6" />,
      color: "orange",
      change: "-5%",
      visible: true,
    },
  ].filter((stat) => stat.visible);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
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
        </div>

        {/* Stats Grid */}
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
                        : "text-red-600"
                    }`}
                  >
                    {stat.change} from last month
                  </p>
                </div>
                <div
                  className={`h-12 w-12 bg-${stat.color}-100 rounded-full flex items-center justify-center text-${stat.color}-600`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
              <Package className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Add Product</h3>
              <p className="text-sm text-gray-500">Create a new product</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left">
              <ShoppingCart className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">View Orders</h3>
              <p className="text-sm text-gray-500">Manage customer orders</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-500">Sales analytics</p>
            </button>
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
