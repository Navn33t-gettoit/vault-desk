"use client";

import { useState } from "react";
import type { VaultScanConfig } from "@/lib/vault-config";
import { DEFAULT_VAULT_PATH, saveVaultScanConfig } from "@/lib/vault-config";
import type { VaultScanResult } from "@/lib/vault-scan-types";

declare global {
  interface Window {
    electronAPI?: { selectFolder: () => Promise<string | null> };
  }
}

type VaultScannerProps = {
  initialPath?: string;
  isConfigured?: boolean;
  onScanComplete: (config: VaultScanConfig) => void;
};

type ScanState = "idle" | "loading" | "error";

export function VaultScanner({ initialPath, isConfigured, onScanComplete }: VaultScannerProps) {
  const [expanded, setExpanded] = useState(!isConfigured);
  const [vaultPath, setVaultPath] = useState(initialPath ?? DEFAULT_VAULT_PATH);
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  async function handleBrowse() {
    const selected = await window.electronAPI?.selectFolder();
    if (selected) setVaultPath(selected);
  }

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
      setExpanded(false);
    } catch (scanError) {
      setState("error");
      setError(scanError instanceof Error ? scanError.message : "Scan failed");
    }
  }

  if (!expanded) {
    return (
      <div className="mb-[var(--silence-pad-section)] flex items-center justify-between gap-4">
        <p className="silence-meta silence-meta-faint truncate">
          Vault: <span className="silence-meta">{vaultPath}</span>
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="silence-meta silence-meta-faint shrink-0 underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <section className="vault-scanner silence-surface soft-glow mb-[var(--silence-pad-section)]">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <p className="silence-meta mb-1">
            {isConfigured ? "Change vault" : "Initialization scan"}
          </p>
          <h2 className="silence-heading text-base tracking-wide">Vault path</h2>
        </div>
        <div className="flex items-center gap-3">
          {state === "loading" && (
            <span className="silence-meta silence-meta-faint">Scanning…</span>
          )}
          {isConfigured && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="silence-meta silence-meta-faint hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          )}
        </div>
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
        {isElectron && (
          <button
            type="button"
            onClick={() => void handleBrowse()}
            className="silence-chip shrink-0 px-4 py-2 sm:py-0"
            disabled={state === "loading"}
          >
            Browse…
          </button>
        )}
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
