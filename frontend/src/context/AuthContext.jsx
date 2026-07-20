import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, loginRequest, registerRequest } from "../api/authApi";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "../utils/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      const hasSession = getAccessToken() || getRefreshToken();
      if (!hasSession) {
        setLoading(false);
        return;
      }
      try {
        const me = await fetchCurrentUser();
        setUser(me);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async ({ username, password }) => {
    setError("");
    try {
      const data = await loginRequest({ username, password });
      setTokens({ access: data.access, refresh: data.refresh });
      const me = await fetchCurrentUser();
      setUser(me);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || "Invalid username or password.";
      setError(message);
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError("");
    try {
      const data = await registerRequest(payload);
      setTokens({ access: data.access, refresh: data.refresh });
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const fieldErrors = err.response?.data;
      const message =
        (fieldErrors && Object.values(fieldErrors).flat()[0]) ||
        "Registration failed. Please try again.";
      setError(message);
      return { success: false, message, fieldErrors };
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, isAuthenticated: !!user }),
    [user, loading, error, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}