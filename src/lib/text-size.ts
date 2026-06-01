export type TextSize = "medium" | "large";

export const TEXT_SIZES: TextSize[] = ["medium", "large"];

export const TEXT_SIZE_STORAGE_KEY = "vault-desk-text-size";

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  medium: "Medium",
  large: "Large",
};

export function isTextSize(value: string): value is TextSize {
  return TEXT_SIZES.includes(value as TextSize);
}

export function resolveTextSize(stored: string | null): TextSize {
  if (stored && isTextSize(stored)) return stored;
  return "medium";
}
