import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

const REQUIREMENTS = [
  { label: "8+ caracteres", test: (value) => value.length >= 8 },
  { label: "Letra maiúscula", test: (value) => /[A-Z]/.test(value) },
  { label: "Letra minúscula", test: (value) => /[a-z]/.test(value) },
  { label: "Número", test: (value) => /\d/.test(value) },
  { label: "Símbolo", test: (value) => /[^A-Za-z0-9]/.test(value) }
];

const PasswordStrength = ({ password }) => {
  const { theme } = useThemeMode();
  const satisfied = useMemo(
    () => REQUIREMENTS.filter((requirement) => requirement.test(password)).length,
    [password]
  );

  const percentage = (satisfied / REQUIREMENTS.length) * 100;
  const palette = theme.palette;

  const colors = [palette.danger, "#ff7a66", palette.warning, "#4dd0e1", palette.accent];
  const colorIndex = Math.min(Math.max(satisfied - 1, 0), colors.length - 1);
  const currentColor = satisfied === 0 ? palette.danger : colors[colorIndex];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.barBackground,
          { backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,25,45,0.1)" }
        ]}
      >
        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: currentColor }]} />
      </View>
      <Text style={[styles.caption, { color: currentColor }]}>
        Força da senha: {["Muito fraca", "Fraca", "Regular", "Boa", "Excelente"][Math.min(satisfied, 4)]}
      </Text>
      <View style={styles.requirements}>
        {REQUIREMENTS.map((requirement) => {
          const passed = requirement.test(password);
          return (
            <Text
              key={requirement.label}
              style={[
                styles.requirement,
                { color: passed ? palette.success : palette.textMuted }
              ]}
            >
              • {requirement.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  barBackground: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8
  },
  barFill: {
    height: "100%",
    borderRadius: 999
  },
  caption: {
    fontSize: 12,
    marginBottom: 10,
    letterSpacing: 0.5
  },
  requirements: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6
  },
  requirement: {
    fontSize: 12,
    marginHorizontal: 6,
    marginBottom: 4
  }
});

export default PasswordStrength;
