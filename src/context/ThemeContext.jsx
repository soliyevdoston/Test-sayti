import React, { useEffect, useState } from "react";
import { ThemeContext } from "./themeContextValue";

export const ThemeProvider = ({ children }) => {
  const resolveInitialTheme = () => {
    const initKey = "themePreferenceInitialized";
    const initialized = localStorage.getItem(initKey) === "1";
    const savedTheme = localStorage.getItem("theme");

    if (!initialized) {
      localStorage.setItem("theme", "dark");
      localStorage.setItem(initKey, "1");
      return "dark";
    }

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return "dark";
  };

  const [theme, setTheme] = useState(() => {
    return resolveInitialTheme();
  });

  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    
    const root = window.document.documentElement;
    
    const applyTheme = (t) => {
      root.classList.remove("light", "dark");
      if (t === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
        setResolvedTheme(systemTheme);
      } else {
        root.classList.add(t);
        setResolvedTheme(t);
      }
    };

    applyTheme(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
