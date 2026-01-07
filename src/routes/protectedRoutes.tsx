import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/context/auth.context";
import type { UserRole } from "@/lib/types/user/user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredModule?: string;
  requiredPermission?: "canCreate" | "canRead" | "canUpdate" | "canDelete";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredModule,
  requiredPermission,
}) => {
  const { user, isLoading, isAuthenticated, permissions } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Super Admin has access to everything
  if (user?.role === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  // Check module permissions for ADMIN role
  if (requiredModule && requiredPermission && user?.role === "ADMIN") {
    const modulePermission = permissions?.find(
      (p) => p.module === requiredModule
    );

    if (!modulePermission || !modulePermission[requiredPermission]) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
