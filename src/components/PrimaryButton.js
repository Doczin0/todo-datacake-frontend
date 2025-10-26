import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

const getVariants = (theme) => {
  const { palette, mode } = theme;
  return {
    primary: {
      backgroundColor: palette.accent,
      textColor: palette.textPrimary,
      borderColor: null
    },
    secondary: {
      backgroundColor: mode === "dark" ? "#163b63" : "#cfe3ff",
      textColor: mode === "dark" ? palette.textPrimary : "#1f2a44",
      borderColor: null
    },
    ghost: {
      backgroundColor: mode === "dark" ? "rgba(10, 27, 50, 0.45)" : "rgba(219, 234, 254, 0.6)",
      textColor: palette.textSecondary,
      borderColor: "rgba(97, 218, 251, 0.35)"
    }
  };
};

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
  icon
}) => {
  const { theme } = useThemeMode();
  const variants = getVariants(theme);
  const palette = variants[variant] ?? variants.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        theme.shadows.glow,
        palette.borderColor ? { borderWidth: 1, borderColor: palette.borderColor } : null,
        {
          backgroundColor:
            disabled || palette.backgroundColor === "transparent"
              ? "rgba(180, 198, 231, 0.22)"
              : pressed
                ? shadeColor(palette.backgroundColor, -12)
                : palette.backgroundColor
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: palette.textColor, marginLeft: icon ? 10 : 0 }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const shadeColor = (color, percent) => {
  if (!color || color === "transparent" || color.startsWith("rgb")) {
    return color;
  }
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = (num >> 16) + amt;
  const g = ((num >> 8) & 0x00ff) + amt;
  const b = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (r < 255 ? (r < 1 ? 0 : r) : 255) * 0x10000 +
      (g < 255 ? (g < 1 ? 0 : g) : 255) * 0x100 +
      (b < 255 ? (b < 1 ? 0 : b) : 255)
    )
      .toString(16)
      .slice(1)
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4
  }
});

export default PrimaryButton;
