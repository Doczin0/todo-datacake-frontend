import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import NeonBackground from "./NeonBackground";
import { useThemeMode } from "../context/ThemeContext";

const AuthLayout = ({ title, subtitle, accent, children, footer }) => {
  const { theme } = useThemeMode();

  return (
    <NeonBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.welcome, { color: theme.palette.accentSoft }]}>{accent}</Text>
          <Text style={[styles.title, { color: theme.palette.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.palette.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.palette.card,
              borderColor: theme.palette.border
            },
            theme.shadows.glow
          ]}
        >
          {children}
        </View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </NeonBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center"
  },
  header: {
    marginBottom: 24,
    alignItems: "center"
  },
  welcome: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    maxWidth: 320,
    textAlign: "center"
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1
  },
  footer: {
    marginTop: 28,
    alignItems: "center"
  }
});

export default AuthLayout;
