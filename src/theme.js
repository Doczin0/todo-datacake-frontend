export const CATEGORY_OPTIONS = [
  { value: "trabalho", label: "Trabalho", icon: "briefcase-outline" },
  { value: "estudos", label: "Estudos", icon: "school-outline" },
  { value: "casa", label: "Casa", icon: "home-outline" },
  { value: "saude", label: "Saúde", icon: "fitness-outline" },
  { value: "pessoal", label: "Pessoal", icon: "sparkles-outline" }
];

export const IMPORTANCE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" }
];

export const AVAILABLE_TAGS = ["Trabalho", "Estudos", "Casa", "Saúde"];

const palettes = {
  dark: {
    background: "#05050d",
    card: "rgba(10, 20, 35, 0.85)",
    cardAlt: "rgba(10, 27, 50, 0.7)",
    surface: "rgba(14, 32, 56, 0.9)",
    border: "rgba(67, 116, 255, 0.35)",
    accent: "#4b9fff",
    accentSoft: "#61dafb",
    accentGlow: "rgba(75, 159, 255, 0.55)",
    accentStrong: "#00c8ff",
    textPrimary: "#f8fbff",
    textSecondary: "#b8c7e0",
    textMuted: "#8190b3",
    success: "#43e6a1",
    warning: "#fbbf24",
    danger: "#ff5f7e",
    info: "#60a5ff",
    overlay: "rgba(5, 10, 20, 0.65)"
  },
  light: {
    background: "#e9f3ff",
    card: "rgba(255, 255, 255, 0.92)",
    cardAlt: "rgba(237, 244, 255, 0.8)",
    surface: "rgba(255, 255, 255, 0.9)",
    border: "rgba(64, 119, 255, 0.25)",
    accent: "#3a7bff",
    accentSoft: "#4aa8ff",
    accentGlow: "rgba(74, 168, 255, 0.35)",
    accentStrong: "#006bff",
    textPrimary: "#111a2c",
    textSecondary: "#42526b",
    textMuted: "#6b7a99",
    success: "#1f9d62",
    warning: "#c08400",
    danger: "#d61f5d",
    info: "#3a7bff",
    overlay: "rgba(233, 243, 255, 0.75)"
  }
};

const buildShadows = (palette) => ({
  glow: {
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: palette === palettes.light ? 0.25 : 0.55,
    shadowRadius: 18,
    elevation: 14
  },
  soft: {
    shadowColor: palette === palettes.light ? "#94a3b8" : "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: palette === palettes.light ? 0.25 : 0.35,
    shadowRadius: 14,
    elevation: 12
  }
});

export const createTheme = (mode = "dark") => {
  const palette = mode === "light" ? palettes.light : palettes.dark;
  return {
    mode,
    palette,
    shadows: buildShadows(palette),
    typography: {
      title: {
        fontSize: 28,
        fontWeight: "700",
        color: palette.textPrimary
      },
      subtitle: {
        fontSize: 16,
        color: palette.textSecondary
      },
      label: {
        fontSize: 14,
        fontWeight: "600",
        color: palette.textSecondary
      }
    }
  };
};

export const getNotificationColors = (palette, type) => {
  switch (type) {
    case "success":
      return { background: "rgba(23, 113, 89, 0.85)", border: palette.success, text: palette.textPrimary };
    case "warning":
      return { background: "rgba(99, 75, 21, 0.78)", border: palette.warning, text: palette.textPrimary };
    case "error":
      return { background: "rgba(112, 21, 42, 0.78)", border: palette.danger, text: palette.textPrimary };
    default:
      return { background: "rgba(21, 61, 112, 0.78)", border: palette.info, text: palette.textPrimary };
  }
};
