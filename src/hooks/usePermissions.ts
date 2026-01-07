import { useAuth } from "@/context/auth.context";

export const usePermissions = () => {
  const { user, permissions } = useAuth();

  const hasPermission = (
    module: string,
    permission: "canCreate" | "canRead" | "canUpdate" | "canDelete"
  ): boolean => {
    // Super Admin has all permissions
    if (user?.role === "SUPER_ADMIN") {
      return true;
    }

    // Check if ADMIN has the specific permission
    if (user?.role === "ADMIN" && permissions) {
      const modulePermission = permissions.find((p) => p.module === module);
      return modulePermission?.[permission] || false;
    }

    return false;
  };

  const hasAnyPermission = (module: string): boolean => {
    return (
      hasPermission(module, "canCreate") ||
      hasPermission(module, "canRead") ||
      hasPermission(module, "canUpdate") ||
      hasPermission(module, "canDelete")
    );
  };

  const getModulePermissions = (module: string) => {
    if (user?.role === "SUPER_ADMIN") {
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    }

    const modulePermission = permissions?.find((p) => p.module === module);
    return {
      canCreate: modulePermission?.canCreate || false,
      canRead: modulePermission?.canRead || false,
      canUpdate: modulePermission?.canUpdate || false,
      canDelete: modulePermission?.canDelete || false,
    };
  };

  return {
    hasPermission,
    hasAnyPermission,
    getModulePermissions,
    permissions,
  };
};
