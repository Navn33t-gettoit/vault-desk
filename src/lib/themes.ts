export type VaultTheme = "midnight" | "paper" | "datapad" | "rosepine" | "nord";

export const VAULT_THEMES: VaultTheme[] = ["midnight", "paper", "datapad", "rosepine", "nord"];

export const THEME_STORAGE_KEY = "vault-desk-theme";

export const THEME_LABELS: Record<VaultTheme, string> = {
  midnight: "Midnight",
  paper: "Paper",
  datapad: "Datapad",
  rosepine: "Rosé Pine",
  nord: "Nord",
};

export function isVaultTheme(value: string): value is VaultTheme {
  return VAULT_THEMES.includes(value as VaultTheme);
}

export function resolveTheme(stored: string | null): VaultTheme {
  if (stored && isVaultTheme(stored)) return stored;
  return "midnight";
}
