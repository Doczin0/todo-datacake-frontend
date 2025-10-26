import React, { useContext, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import TaskListScreen from "../screens/TaskListScreen";
import TaskFormScreen from "../screens/TaskFormScreen";
import { useThemeMode } from "../context/ThemeContext";

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

const LoadingSplash = () => {
  const { theme } = useThemeMode();
  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.palette.background }}
    >
      <ActivityIndicator size="large" color={theme.palette.accent} />
    </View>
  );
};

const AuthStackScreens = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </AuthStack.Navigator>
);

const AppStackScreens = ({ theme }) => (
  <AppStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: "rgba(10, 24, 45, 0.9)" },
      headerTintColor: theme.palette.textPrimary,
      headerTitleStyle: { fontWeight: "700" },
      headerShadowVisible: false
    }}
  >
    <AppStack.Screen
      name="Tasks"
      component={TaskListScreen}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="TaskForm"
      component={TaskFormScreen}
      options={({ route }) => ({
        title: route.params?.task ? "Editar Tarefa" : "Nova Tarefa"
      })}
    />
  </AppStack.Navigator>
);

const AppNavigator = () => {
  const { user, initializing } = useContext(AuthContext);
  const { theme } = useThemeMode();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: theme.mode === "dark",
      colors: {
        ...DefaultTheme.colors,
        background: theme.palette.background,
        card: "rgba(8, 18, 34, 0.9)",
        text: theme.palette.textPrimary,
        border: "rgba(75, 159, 255, 0.35)",
        primary: theme.palette.accent
      }
    }),
    [theme]
  );

  if (initializing) {
    return <LoadingSplash />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? <AppStackScreens theme={theme} /> : <AuthStackScreens />}
    </NavigationContainer>
  );
};

export default AppNavigator;
