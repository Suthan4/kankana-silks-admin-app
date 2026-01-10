import { adminUserApi, authApi } from "@/lib/api/api.auth.service";
import type { Permission, User } from "@/lib/types/user/user";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface AuthContextType {
  user: User | null;
  permissions: Permission[] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    user: User,
    accessToken: string,
    refreshToken: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = async (userId: string) => {
    try {
      const response = await adminUserApi.getUserPermissions(userId);
      if (response.success && response.data) {
        setPermissions(response.data);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissions(null);
    }
  };

  /**
   * Init auth on app load
   */
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const storedUser = localStorage.getItem("user");

      if (!accessToken || !refreshToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getProfile();
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem("user", JSON.stringify(response.data));

          if (response.data.role === "ADMIN") {
            await fetchPermissions(response.data.id);
          }
        } else {
          clearAuthStorage();
        }
      } catch {
        clearAuthStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login handler
   */
  const login = async (
    user: User,
    accessToken: string,
    refreshToken: string
  ) => {
    setUser(user);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    if (user.role === "ADMIN") {
      await fetchPermissions(user.id);
    }
  };

  /**
   * Logout handler
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthStorage();
      setUser(null);
      setPermissions(null);
    }
  };

  /**
   * Update user profile
   */
  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    if (updatedUser.role === "ADMIN") {
      await fetchPermissions(updatedUser.id);
    }
  };

  /**
   * Refresh permissions manually
   */
  const refreshPermissions = async () => {
    if (user?.role === "ADMIN") {
      await fetchPermissions(user.id);
    }
  };

  const clearAuthStorage = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
