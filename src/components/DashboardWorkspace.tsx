"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardGrid } from "@/components/DashboardGrid";
import { VaultScanner } from "@/components/VaultScanner";
import {
  type VaultScanConfig,
  loadVaultScanConfig,
} from "@/lib/vault-config";
import { ROOT_TOPIC } from "@/lib/vault-scan-types";
import type { DashboardNote } from "@/lib/note-display";

type DashboardWorkspaceProps = {
  initialNotes: DashboardNote[];
  initialVaultPath?: string;
};

const ALL_TOPICS = "All";

function scannedNotesToDashboard(notes: VaultScanConfig["notes"]): DashboardNote[] {
  return notes.map((note) => ({
    slug: note.slug,
    updatedAt: note.updatedAt,
    title: note.title,
    topic: note.topic,
    relativePath: note.relativePath,
  }));
}

export function DashboardWorkspace({
  initialNotes,
  initialVaultPath,
}: DashboardWorkspaceProps) {
  const [scanConfig, setScanConfig] = useState<VaultScanConfig | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>(ALL_TOPICS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setScanConfig(loadVaultScanConfig());
    setHydrated(true);
  }, []);

  const notes = useMemo(() => {
    if (scanConfig?.notes.length) {
      return scannedNotesToDashboard(scanConfig.notes);
    }
    return initialNotes;
  }, [scanConfig, initialNotes]);

  const topics = useMemo(() => {
    if (scanConfig?.topics.length) {
      return scanConfig.topics;
    }
    const derived = new Set(
      notes.map((note) => note.topic ?? ROOT_TOPIC),
    );
    return [ROOT_TOPIC, ...[...derived].filter((t) => t !== ROOT_TOPIC).sort()];
  }, [scanConfig, notes]);

  const topicTabs = useMemo(() => [ALL_TOPICS, ...topics], [topics]);

  const filteredNotes = useMemo(() => {
    if (activeTopic === ALL_TOPICS) return notes;
    return notes.filter((note) => (note.topic ?? ROOT_TOPIC) === activeTopic);
  }, [activeTopic, notes]);

  const handleScanComplete = useCallback((config: VaultScanConfig) => {
    setScanConfig(config);
    setActiveTopic(ALL_TOPICS);
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <>
      <VaultScanner
        initialPath={scanConfig?.vaultPath ?? initialVaultPath}
        onScanComplete={handleScanComplete}
      />

      {notes.length > 0 && (
        <nav
          className="topic-tabs mb-[var(--silence-pad-inline)]"
          aria-label="Major topics"
        >
          {topicTabs.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setActiveTopic(topic)}
              className={[
                "topic-tab silence-chip",
                activeTopic === topic ? "topic-tab-active soft-glow" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={activeTopic === topic}
            >
              {topic}
            </button>
          ))}
        </nav>
      )}

      {scanConfig && (
        <p className="silence-meta silence-meta-faint mb-4">
          {scanConfig.notesCount} notes · {scanConfig.topics.length} topics ·{" "}
          {scanConfig.vaultPath}
        </p>
      )}

      <p className="silence-meta silence-meta-faint mb-4">
        Drag to reorder · drop onto a card to bundle into a sub-vault
      </p>

      <DashboardGrid notes={filteredNotes} />
    </>
  );
}
