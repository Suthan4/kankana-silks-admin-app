import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/context/auth.context";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Star,
  RotateCcw,
  MessageSquare,
  Truck,
  Warehouse,
  Layers,
  Grid,
  Image,
  MoreHorizontal,
  Video,
  TicketPercent,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  module?: string; // Module name for permission check
}

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Check if user has read permission for a module
  const hasModuleAccess = (moduleName: string): boolean => {
    // Super Admin has access to everything
    if (user?.role === "SUPER_ADMIN") {
      return true;
    }

    // Check if ADMIN has canRead permission for this module
    if (user?.role === "ADMIN" && permissions) {
      const modulePermission = permissions.find((p) => p.module === moduleName);
      return modulePermission?.canRead || false;
    }

    return false;
  };

  // Navigation items based on user role (Admin-only dashboard)
  const getNavItems = (): NavItem[] => {
    const dashboardItem: NavItem[] = [
      {
        name: "Dashboard",
        path: user?.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ];

    const adminItems: NavItem[] = [
      {
        name: "Categories",
        path: "/admin/categories",
        icon: <Layers className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "categories",
      },
      {
        name: "Warehouses",
        path: "/admin/warehouses",
        icon: <Warehouse className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "warehouses",
      },
      {
        name: "Products",
        path: "/admin/products",
        icon: <Package className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "products",
      },
      {
        name: "Orders",
        path: "/admin/orders",
        icon: <ShoppingCart className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "orders",
      },
      {
        name: "Home Sections",
        path: "/admin/home-sections",
        icon: <Grid className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "home-sections",
      },
      {
        name: "Banner",
        path: "/admin/banner",
        icon: <Image className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "banner",
      },
      {
        name: "Coupon",
        path: "/admin/coupons",
        icon: <TicketPercent className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "coupons",
      },
      {
        name: "Reviews",
        path: "/admin/reviews",
        icon: <Star className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "reviews",
      },
      {
        name: "Returns",
        path: "/admin/returns",
        icon: <RotateCcw className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "returns",
      },
      {
        name: "Consultations",
        path: "/admin/consultations",
        icon: <Video className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "consultations",
      },
      {
        name: "Shipments",
        path: "/admin/shipments",
        icon: <Truck className="h-5 w-5" />,
        roles: ["ADMIN", "SUPER_ADMIN"],
        module: "shipments",
      },
    ];

    const superAdminItems: NavItem[] = [
      {
        name: "User Management",
        path: "/admin/user-management",
        icon: <Users className="h-5 w-5" />,
        roles: ["SUPER_ADMIN"],
      },
    ];

    let items = [...dashboardItem];

    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
      // Filter admin items based on permissions
      const filteredAdminItems = adminItems.filter((item) => {
        if (!item.module) return true;
        return hasModuleAccess(item.module);
      });
      items = [...items, ...filteredAdminItems];
    }

    if (user?.role === "SUPER_ADMIN") {
      items = [...items, ...superAdminItems];
    }

    return items.filter(
      (item) => !item.roles || item.roles.includes(user?.role || "")
    );
  };

    const navItems = getNavItems();
    const MAX_VISIBLE_ITEMS = 4;

    const visibleItems = navItems.slice(0, MAX_VISIBLE_ITEMS);
    const overflowItems = navItems.slice(MAX_VISIBLE_ITEMS);

    const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">
                  Admin App
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {visibleItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              ))}

              {overflowItems.length > 0 && (
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
                    <MoreHorizontal className="h-5 w-5" />
                    <span>More</span>
                  </button>

                  {/* Dropdown */}
                  <div
                    className="
      absolute right-0 top-full
      pt-2
      w-52
      bg-white border rounded-lg shadow-lg
      opacity-0 invisible
      group-hover:opacity-100 group-hover:visible
      transition
    "
                  >
                    {overflowItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2024 Admin App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
