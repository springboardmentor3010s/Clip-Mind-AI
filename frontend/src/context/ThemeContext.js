"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("clipmind_theme");
    if (saved === "dark") setIsDark(true);
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      localStorage.setItem("clipmind_theme", !prev ? "dark" : "light");
      return !prev;
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}