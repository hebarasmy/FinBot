"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light";

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  theme: Theme;
};

const initialState: ThemeProviderState = {
  theme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    root.classList.add("light");
    root.setAttribute("data-theme", "light");
  }, [mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProviderContext.Provider value={initialState}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
