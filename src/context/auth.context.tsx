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
    } catch {
      setPermissions(null);
    }
  };

  // 🔥 THIS IS WHERE YOUR QUESTION APPLIES
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken"); // ✅ HERE
      const refreshToken = localStorage.getItem("refreshToken"); // ✅ HERE
      const storedUser = localStorage.getItem("user");

      if (token && refreshToken && storedUser) {
        try {
          const response = await authApi.getProfile();

          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));

            if (response.data.role === "ADMIN") {
              await fetchPermissions(response.data.id);
            }
          } else {
            clearStorage();
          }
        } catch {
          clearStorage();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

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

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearStorage();
      setUser(null);
      setPermissions(null);
    }
  };

  const updateUser = async (user: User) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));

    if (user.role === "ADMIN") {
      await fetchPermissions(user.id);
    }
  };

  const refreshPermissions = async () => {
    if (user?.role === "ADMIN") {
      await fetchPermissions(user.id);
    }
  };

  const clearStorage = () => {
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
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
