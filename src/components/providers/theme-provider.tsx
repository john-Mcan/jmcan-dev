"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readThemePref, writeThemePref } from "@/lib/prefs";

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within <ThemeProvider />");
  }
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default: dark. Si el usuario eligió un tema antes, lo respetamos (sin auto-detección).
  const [theme, setTheme] = useState<Theme>(() => readThemePref() ?? "dark");

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    writeThemePref(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

