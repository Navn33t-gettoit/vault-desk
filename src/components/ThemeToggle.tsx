"use client";

import { THEME_LABELS } from "@/lib/themes";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="silence-chip transition-opacity hover:opacity-90"
      aria-label={`Theme: ${THEME_LABELS[theme]}. Click to switch.`}
      title="Cycle theme"
    >
      {THEME_LABELS[theme]}
    </button>
  );
}
