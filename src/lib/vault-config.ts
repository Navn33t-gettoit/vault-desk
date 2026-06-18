import type { ScannedNote } from "@/lib/vault-scan-types";

export const DEFAULT_VAULT_PATH = "";
export const VAULT_SCAN_STORAGE_KEY = "vault-desk-scan-config";

export type VaultScanConfig = {
  vaultPath: string;
  topics: string[];
  notesCount: number;
  notes: ScannedNote[];
  scannedAt: string;
};

export function loadVaultScanConfig(): VaultScanConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(VAULT_SCAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VaultScanConfig;
    if (!parsed.vaultPath || !Array.isArray(parsed.notes) || !Array.isArray(parsed.topics)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveVaultScanConfig(config: VaultScanConfig): void {
  localStorage.setItem(VAULT_SCAN_STORAGE_KEY, JSON.stringify(config));
}

export function clearVaultScanConfig(): void {
  localStorage.removeItem(VAULT_SCAN_STORAGE_KEY);
}
