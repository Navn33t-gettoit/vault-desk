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
  type TextSize,
  TEXT_SIZE_STORAGE_KEY,
  resolveTextSize,
} from "@/lib/text-size";

type TextSizeContextValue = {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  toggleTextSize: () => void;
  ready: boolean;
};

const TextSizeContext = createContext<TextSizeContextValue | null>(null);

function applyTextSize(size: TextSize) {
  document.documentElement.setAttribute("data-text-size", size);
}

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>("medium");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    const resolved = resolveTextSize(stored);
    setTextSizeState(resolved);
    applyTextSize(resolved);
    setReady(true);
  }, []);

  const setTextSize = useCallback((next: TextSize) => {
    setTextSizeState(next);
    applyTextSize(next);
    localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next);
  }, []);

  const toggleTextSize = useCallback(() => {
    setTextSizeState((current) => {
      const next: TextSize = current === "medium" ? "large" : "medium";
      applyTextSize(next);
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ textSize, setTextSize, toggleTextSize, ready }),
    [textSize, setTextSize, toggleTextSize, ready],
  );

  return (
    <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>
  );
}

export function useTextSize() {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error("useTextSize must be used within TextSizeProvider");
  }
  return context;
}
