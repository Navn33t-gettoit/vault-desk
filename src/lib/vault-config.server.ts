import fs from "fs/promises";
import path from "path";
import { DEFAULT_VAULT_PATH } from "@/lib/vault-config";

const CONFIG_DIR = path.join(process.cwd(), ".vault-desk");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export type ServerVaultConfig = {
  vaultPath: string;
  lastScanAt: string;
};

export async function getConfiguredVaultPath(): Promise<string> {
  if (process.env.VAULT_PATH) {
    return path.resolve(process.env.VAULT_PATH);
  }

  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw) as ServerVaultConfig;
    if (parsed.vaultPath && typeof parsed.vaultPath === "string") {
      return path.resolve(parsed.vaultPath);
    }
  } catch {
    // fall through
  }

  return DEFAULT_VAULT_PATH;
}

export async function saveConfiguredVaultPath(vaultPath: string): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const payload: ServerVaultConfig = {
    vaultPath: path.resolve(vaultPath),
    lastScanAt: new Date().toISOString(),
  };
  await fs.writeFile(CONFIG_FILE, JSON.stringify(payload, null, 2), "utf8");
}
