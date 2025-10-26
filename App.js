import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./src/lib/queryClient";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useThemeMode } from "./src/context/ThemeContext";
import { NotificationProvider, useNotifications } from "./src/context/NotificationContext";
import NotificationCenter from "./src/components/NotificationCenter";
import AppNavigator from "./src/navigation/AppNavigator";
import { ensureApiBaseUrl } from "./src/api/client";

const AppShell = () => {
  const { theme } = useThemeMode();
  const { pushNotification } = useNotifications();

  useEffect(() => {
    let mounted = true;
    ensureApiBaseUrl().then((meta) => {
      if (!mounted) {
        return;
      }
      if (meta.source === "fallback") {
        pushNotification({
          type: "warning",
          message:
            "Não consegui encontrar o backend automaticamente. Garanta que o servidor esteja acessível na mesma rede ou defina EXPO_PUBLIC_API_URL."
        });
      } else if (meta.source === "auto-probe") {
        pushNotification({
          type: "success",
          message: `Backend detectado automaticamente em ${meta.resolvedBaseUrl}.`
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [pushNotification]);

  return (
    <>
      <StatusBar
        style={theme.mode === "dark" ? "light" : "dark"}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
      <NotificationCenter />
    </>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <AppShell />
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
