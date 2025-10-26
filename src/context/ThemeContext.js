import React, { createContext, useContext, useMemo, useState } from "react";
import { createTheme } from "../theme";

const ThemeContext = createContext({
  mode: "dark",
  theme: createTheme("dark"),
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("dark");

  const toggleTheme = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      theme: createTheme(mode)
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => useContext(ThemeContext);
