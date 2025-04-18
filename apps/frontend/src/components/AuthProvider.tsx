import type { IPublicUser } from "@chatty/shared/src";
import axios from "axios";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

export const AuthContext: any = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({
  initialUser = null,
  children,
}: {
  initialUser: IPublicUser | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    if (!initialUser) {
      checkAuthStatus();
    }
  }, [initialUser]);

  // Function to check auth status
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.PUBLIC_SERVER_API_AUTH_URL}/me`
      );

      if (response.status === 200) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      window.location.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post("/api/auth/login", {
        body: { email, password },
      });

      if (response.status === 200) {
        setUser(response.data.data);
        return { success: true };
      } else {
        const error = await response.data;
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: "Login failed" };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: "Logout failed" };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
