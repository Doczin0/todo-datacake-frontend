import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api, { clearAuthTokens, getAuthTokens, setAuthTokens, subscribeUnauthorized } from "../api/client";
import { queryClient } from "../lib/queryClient";

export const AuthContext = createContext({
  user: null,
  initializing: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  verifyEmail: async () => {},
  resendCode: async () => {},
  requestPasswordReset: async () => {},
  confirmPasswordReset: async () => {}
});

const extractErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) {
    return fallback;
  }
  if (typeof data === "string") {
    return data;
  }
  if (typeof data.detail === "string") {
    return data.detail;
  }
  const firstValue = Object.values(data)[0];
  if (Array.isArray(firstValue)) {
    return firstValue[0];
  }
  if (typeof firstValue === "string") {
    return firstValue;
  }
  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const loadProfile = useCallback(async () => {
    const { accessToken } = getAuthTokens();
    if (!accessToken) {
      setUser(null);
      setInitializing(false);
      return;
    }
    try {
      const { data } = await api.get("auth/me/");
      setUser(data);
    } catch (_error) {
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeUnauthorized(() => {
      clearAuthTokens();
      setUser(null);
      queryClient.clear();
    });
    loadProfile();
    return unsubscribe;
  }, [loadProfile]);

  const login = useCallback(async ({ identifier, password }) => {
    try {
      const { data } = await api.post("auth/token/", { identifier, password });
      if (!data?.access || !data?.refresh) {
        throw new Error("Resposta de login incompleta.");
      }
      setAuthTokens({
        accessToken: data.access,
        refreshToken: data.refresh
      });
      await loadProfile();
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Nao foi possivel autenticar."));
    }
  }, [loadProfile]);

  const logout = useCallback(async () => {
    try {
      await api.post("auth/logout/");
    } catch (error) {
      console.warn("Logout falhou, limpando sessao local.", error);
    } finally {
      clearAuthTokens();
      setUser(null);
      queryClient.clear();
    }
  }, []);

  const register = useCallback(async ({ username, email, password, confirmPassword }) => {
    try {
      await api.post("auth/register/", {
        username,
        email,
        password,
        confirm_password: confirmPassword
      });
      return { email, username };
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Não foi possível registrar."));
    }
  }, []);

  const verifyEmail = useCallback(async ({ email, code }) => {
    try {
      await api.post("auth/verify/", { email, code });
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Código inválido ou expirado."));
    }
  }, []);

  const resendCode = useCallback(async ({ email }) => {
    try {
      await api.post("auth/resend/", { email });
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Não foi possível reenviar o código."));
    }
  }, []);

  const requestPasswordReset = useCallback(async ({ email }) => {
    try {
      await api.post("auth/password/reset/", { email });
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Não foi possível enviar o código."));
    }
  }, []);

  const confirmPasswordReset = useCallback(async ({ email, code, password }) => {
    try {
      await api.post("auth/password/confirm/", { email, code, password });
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Não foi possível redefinir a senha."));
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      logout,
      register,
      verifyEmail,
      resendCode,
      requestPasswordReset,
      confirmPasswordReset
    }),
    [
      user,
      initializing,
      login,
      logout,
      register,
      verifyEmail,
      resendCode,
      requestPasswordReset,
      confirmPasswordReset
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
