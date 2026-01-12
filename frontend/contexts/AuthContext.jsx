"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../lib/api";
import { toast } from "react-toastify";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("messenger-token");
    localStorage.removeItem("messenger-user");
    localStorage.removeItem("messenger-remembered-email");
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    router.push("/auth/login");
  };

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem("messenger-token");
        const storedUser = localStorage.getItem("messenger-user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear invalid data
        localStorage.removeItem("messenger-token");
        localStorage.removeItem("messenger-user");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      // Backend accepts username or email in the username field
      const response = await apiClient.auth.login({ 
        username: emailOrUsername, 
        password 
      });
      const { access_token, user: userData } = response.data;

      // Store token and user
      localStorage.setItem("messenger-token", access_token);
      localStorage.setItem("messenger-user", JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);

      toast.success(`Welcome back, ${userData.username}!`);
      return { success: true, user: userData };
    } catch (error) {
      const message =
        error.response?.data?.message || "Invalid email or password";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.name === role || r === role);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

