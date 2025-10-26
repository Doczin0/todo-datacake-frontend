import React from "react";
import { ImageBackground, View, StyleSheet } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

const NeonBackground = ({ children }) => {
  const { theme } = useThemeMode();
  const overlayColor =
    theme.mode === "dark" ? theme.palette.overlay : "rgba(255, 255, 255, 0.45)";

  return (
    <ImageBackground
      source={require("../../assets/neon-grid.png")}
      resizeMode="cover"
      style={[styles.background, { backgroundColor: theme.palette.background }]}
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  overlay: {
    ...StyleSheet.absoluteFillObject
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32
  }
});

export default NeonBackground;
