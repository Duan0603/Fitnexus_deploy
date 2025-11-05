import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({
  theme: "system", // 'light' | 'dark' | 'system'
  isDark: false,
  setTheme: () => {},
  toggle: () => {},
});

const getStoredTheme = () => {
  try {
    return localStorage.getItem("theme") || "system";
  } catch {
    return "system";
  }
};

const storeTheme = (value) => {
  try {
    localStorage.setItem("theme", value);
  } catch {}
};

const getSystemPrefersDark = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme());
  const [systemDark, setSystemDark] = useState(getSystemPrefersDark());

  const isDark = useMemo(() => (theme === "dark" ? true : theme === "light" ? false : systemDark), [theme, systemDark]);

  useEffect(() => {
    // Persist and apply class to <html>
    storeTheme(theme);
    const root = document.documentElement;
    if (isDark) root.classList.add("dark"); else root.classList.remove("dark");
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [theme, isDark]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSystemDark(e.matches);
    try {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } catch {
      // Safari fallback
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  const value = useMemo(() => ({
    theme,
    isDark,
    setTheme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  }), [theme, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

