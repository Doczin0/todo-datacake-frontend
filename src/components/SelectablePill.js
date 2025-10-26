import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../context/ThemeContext";

const SelectablePill = ({ label, active = false, onPress, icon, style }) => {
  const { theme } = useThemeMode();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: active
            ? theme.palette.accentGlow
            : theme.mode === "dark"
              ? "rgba(15, 27, 50, 0.55)"
              : "rgba(203, 225, 255, 0.6)",
          borderColor: active ? theme.palette.accent : "transparent",
          opacity: pressed ? 0.85 : 1
        },
        style
      ]}
    >
      <View style={styles.content}>
        {icon ? <Ionicons name={icon} size={16} color={theme.palette.textSecondary} style={styles.icon} /> : null}
        <Text
          style={[
            styles.label,
            {
              color: active ? theme.palette.textPrimary : theme.palette.textSecondary
            }
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1
  },
  content: {
    flexDirection: "row",
    alignItems: "center"
  },
  label: {
    fontSize: 13,
    fontWeight: "600"
  },
  icon: {
    marginRight: 6
  }
});

export default SelectablePill;
