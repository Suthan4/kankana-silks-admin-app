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
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
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

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          // Verify token is still valid by fetching profile
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));

            // Fetch permissions for ADMIN users
            if (response.data.role === "ADMIN") {
              await fetchPermissions(response.data.id);
            }
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
          }
        } catch (error) {
          // Error fetching profile, clear storage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (user: User, token: string) => {
    setUser(user);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    // Fetch permissions for ADMIN users
    if (user.role === "ADMIN") {
      await fetchPermissions(user.id);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setPermissions(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  };

  const updateUser = async (user: User) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));

    // Refresh permissions if ADMIN
    if (user.role === "ADMIN") {
      await fetchPermissions(user.id);
    }
  };

  const refreshPermissions = async () => {
    if (user && user.role === "ADMIN") {
      await fetchPermissions(user.id);
    }
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
