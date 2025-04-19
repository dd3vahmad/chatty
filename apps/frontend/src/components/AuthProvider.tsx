import type { IPublicUser } from "@chatty/shared/src";
import axios from "axios";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

interface IAuth {
  login: (identifier: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  user: IPublicUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const defaultAuthContext: IAuth = {
  login: async () => ({ success: false, error: "Not initialized" }),
  logout: async () => ({ success: false, error: "Not initialized" }),
  user: null,
  loading: true,
  isAuthenticated: false,
};

export const AuthContext = createContext<IAuth>(defaultAuthContext);

export function useAuth() {
  return useContext(AuthContext) as IAuth;
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

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.PUBLIC_SERVER_API_AUTH_URL}/me`,
        { withCredentials: true }
      );

      if (response.status === 200) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      console.log("AuthProvider: login called with", identifier); // ✅
      const apiUrl = import.meta.env.PUBLIC_SERVER_API_AUTH_URL;
      console.log("Login URL:", `${apiUrl}/login`); // ✅
      const response = await axios.post(
        `${apiUrl}/login`,
        {
          identifier,
          password,
        },
        { withCredentials: true }
      );

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
