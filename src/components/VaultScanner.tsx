"use client";

import { useState } from "react";
import type { VaultScanConfig } from "@/lib/vault-config";
import { DEFAULT_VAULT_PATH, saveVaultScanConfig } from "@/lib/vault-config";
import type { VaultScanResult } from "@/lib/vault-scan-types";

type VaultScannerProps = {
  initialPath?: string;
  onScanComplete: (config: VaultScanConfig) => void;
};

type ScanState = "idle" | "loading" | "error";

export function VaultScanner({ initialPath, onScanComplete }: VaultScannerProps) {
  const [vaultPath, setVaultPath] = useState(initialPath ?? DEFAULT_VAULT_PATH);
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    setState("loading");
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultPath }),
      });

      const payload = (await response.json()) as VaultScanResult | { error?: string };

      if (!response.ok || !("success" in payload) || !payload.success) {
        throw new Error("error" in payload ? payload.error : "Scan failed");
      }

      const config: VaultScanConfig = {
        vaultPath: vaultPath.trim(),
        topics: payload.topics,
        notesCount: payload.notesCount,
        notes: payload.notes,
        scannedAt: new Date().toISOString(),
      };

      saveVaultScanConfig(config);
      onScanComplete(config);
      setState("idle");
    } catch (scanError) {
      setState("error");
      setError(scanError instanceof Error ? scanError.message : "Scan failed");
    }
  }

  return (
    <section className="vault-scanner silence-surface soft-glow mb-[var(--silence-pad-section)]">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <p className="silence-meta mb-1">Initialization scan</p>
          <h2 className="silence-heading text-base tracking-wide">Vault path</h2>
        </div>
        {state === "loading" && (
          <span className="silence-meta silence-meta-faint">Scanning…</span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input
          type="text"
          value={vaultPath}
          onChange={(event) => setVaultPath(event.target.value)}
          placeholder="/path/to/your/obsidian/vault"
          className="vault-scanner-input flex-1"
          aria-label="Local vault directory path"
          disabled={state === "loading"}
        />
        <button
          type="button"
          onClick={() => void handleScan()}
          className="silence-chip soft-glow shrink-0 px-4 py-2 sm:py-0"
          disabled={state === "loading" || vaultPath.trim().length === 0}
        >
          {state === "loading" ? "Scanning…" : "Scan vault"}
        </button>
      </div>

      {error && (
        <p className="silence-meta mt-3 text-[var(--silence-accent)]" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
