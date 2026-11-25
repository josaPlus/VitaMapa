import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, onUnauthorized, readSession, saveSession } from "../api/client";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(() => readSession());
  // "checking" mientras se confirma con el backend que el token sigue vigente
  const [status, setStatus] = useState(() => (readSession()?.token ? "checking" : "ready"));

  const logout = useCallback(() => {
    saveSession(null);
    setSession(null);
  }, []);

  // si cualquier petición regresa 401, se cierra la sesión
  useEffect(() => {
    onUnauthorized((message) => {
      logout();
      toast.error("Sesión terminada", message || "Vuelve a iniciar sesión");
    });
  }, [logout, toast]);

  useEffect(() => {
    if (status !== "checking") return;

    api.get("/auth/me")
      .then(({ data }) => {
        const next = { ...readSession(), user: data };
        saveSession(next);
        setSession(next);
      })
      .catch(() => logout())
      .finally(() => setStatus("ready"));
  }, [status, logout]);

  const startSession = useCallback(({ user, token }) => {
    const next = { user, token };
    saveSession(next);
    setSession(next);
    return user;
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    return startSession(data);
  }, [startSession]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return startSession(data);
  }, [startSession]);

  const value = useMemo(() => ({
    user: session?.user || null,
    isReady: status === "ready",
    login,
    register,
    logout
  }), [session, status, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
