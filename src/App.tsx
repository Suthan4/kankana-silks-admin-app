import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/auth.context";
import { LoginPage } from "./pages/auth/loginPage";
import { RegisterPage } from "./pages/auth/registerPage";
import { UnauthorizedPage } from "./components/unAuthorized";
import { ProtectedRoute } from "./routes/protectedRoutes";
import { AdminDashboard } from "./pages/admin/adminDashboard";
import ProductsPage from "./pages/admin/productsPage";
import ReviewsPage from "./pages/admin/reviewsPage";
import WarehousesPage from "./pages/admin/warehousesPage";
import ReturnsPage from "./pages/admin/returnsPage";
import ConsultationsPage from "./pages/admin/consultationsPage";
import { SuperAdminDashboard } from "./pages/superAdmin/superAdminDashboard";
import OrdersPage from "./pages/admin/ordersPage";
import ShipmentsPage from "./pages/admin/shipmentsPage";
import "./index.css";
import CategoriesPage from "./pages/admin/categoryPage";
import { HomeSectionsPage } from "./pages/admin/homeSectionsPage";
import { Toaster } from "react-hot-toast";
import BannersPage from "./pages/admin/bannerPage";


// Admin Pages


// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Component to handle initial redirect based on user role
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role - Only admins allowed
  if (user.role === "SUPER_ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user.role === "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  } else {
    // Regular users not allowed in admin dashboard
    return <Navigate to="/unauthorized" replace />;
  }
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Admin Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Module Routes */}
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="products"
                  requiredPermission="canRead"
                >
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="categories"
                  requiredPermission="canRead"
                >
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="orders"
                  requiredPermission="canRead"
                >
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/warehouses"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="warehouses"
                  requiredPermission="canRead"
                >
                  <WarehousesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/home-sections"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="home-sections"
                  requiredPermission="canRead"
                >
                  <HomeSectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banner"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="banner"
                  requiredPermission="canRead"
                >
                  <BannersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="reviews"
                  requiredPermission="canRead"
                >
                  <ReviewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/returns"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="returns"
                  requiredPermission="canRead"
                >
                  <ReturnsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/consultations"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="consultations"
                  requiredPermission="canRead"
                >
                  <ConsultationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/shipments"
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  requiredModule="shipments"
                  requiredPermission="canRead"
                >
                  <ShipmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Super Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Root Route - Redirect based on role */}
            <Route path="/" element={<RootRedirect />} />

            {/* Catch all - redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
