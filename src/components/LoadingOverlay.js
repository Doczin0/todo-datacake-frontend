import React from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

const LoadingOverlay = ({ visible }) => {
  const { theme } = useThemeMode();

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View
        style={[
          styles.backdrop,
          { backgroundColor: theme.mode === "dark" ? "rgba(3, 9, 18, 0.65)" : "rgba(15, 25, 45, 0.25)" }
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.palette.surface,
              borderColor: theme.palette.accentGlow
            },
            theme.shadows.glow
          ]}
        >
          <ActivityIndicator size="large" color={theme.palette.accent} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1
  }
});

export default LoadingOverlay;
