"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type VaultTheme,
  VAULT_THEMES,
  THEME_STORAGE_KEY,
  resolveTheme,
} from "@/lib/themes";

type ThemeContextValue = {
  theme: VaultTheme;
  setTheme: (theme: VaultTheme) => void;
  cycleTheme: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: VaultTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<VaultTheme>("midnight");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const resolved = resolveTheme(stored);
    setThemeState(resolved);
    applyTheme(resolved);
    setReady(true);
  }, []);

  const setTheme = useCallback((next: VaultTheme) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const idx = VAULT_THEMES.indexOf(current);
      const next = VAULT_THEMES[(idx + 1) % VAULT_THEMES.length];
      applyTheme(next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme, ready }),
    [theme, setTheme, cycleTheme, ready],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
