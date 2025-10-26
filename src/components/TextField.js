import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  multiline = false,
  numberOfLines = 1,
  editable = true,
  error,
  onBlur,
  onFocus,
  rightAccessory
}) => {
  const [focused, setFocused] = useState(false);
  const { theme } = useThemeMode();

  const borderColor = error
    ? theme.palette.danger
    : focused
      ? theme.palette.accent
      : theme.mode === "dark"
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(30, 64, 175, 0.25)";

  const backgroundColor =
    theme.mode === "dark" ? "rgba(11, 24, 43, 0.85)" : "rgba(255, 255, 255, 0.95)";

  const placeholderColor =
    theme.mode === "dark" ? "rgba(191, 201, 226, 0.5)" : "rgba(79, 97, 134, 0.6)";

  const handleFocus = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.palette.textSecondary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor,
            opacity: editable ? 1 : 0.6
          }
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          style={[
            styles.input,
            { color: theme.palette.textPrimary },
            multiline && styles.multiline
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
      {error ? <Text style={[styles.error, { color: theme.palette.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6
  },
  inputContainer: {
    borderWidth: 1.2,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center"
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15
  },
  multiline: {
    minHeight: 108,
    textAlignVertical: "top"
  },
  error: {
    marginTop: 6,
    fontSize: 12
  },
  accessory: {
    marginLeft: 12
  }
});

export default TextField;
