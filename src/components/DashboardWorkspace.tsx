"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardGrid } from "@/components/DashboardGrid";
import { VaultScanner } from "@/components/VaultScanner";
import {
  type VaultScanConfig,
  loadVaultScanConfig,
} from "@/lib/vault-config";
import { ROOT_TOPIC } from "@/lib/vault-scan-types";
import { displayTitle } from "@/lib/note-display";
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
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setScanConfig(loadVaultScanConfig());
    setHydrated(true);
  }, []);

  const notes = useMemo(() => {
    if (scanConfig?.notes.length) return scannedNotesToDashboard(scanConfig.notes);
    return initialNotes;
  }, [scanConfig, initialNotes]);

  const topics = useMemo(() => {
    const derived = new Set(notes.map((n) => n.topic ?? ROOT_TOPIC));
    return [ROOT_TOPIC, ...[...derived].filter((t) => t !== ROOT_TOPIC).sort()];
  }, [notes]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      const t = note.topic ?? ROOT_TOPIC;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = activeTopic === ALL_TOPICS
      ? notes
      : notes.filter((n) => (n.topic ?? ROOT_TOPIC) === activeTopic);

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((n) =>
        (n.title ?? displayTitle(n.slug)).toLowerCase().includes(q),
      );
    }

    return result;
  }, [notes, activeTopic, search]);

  const handleScanComplete = useCallback((config: VaultScanConfig) => {
    setScanConfig(config);
    setActiveTopic(ALL_TOPICS);
    setSearch("");
  }, []);

  if (!hydrated) return null;

  const isConfigured = !!(scanConfig?.vaultPath ?? initialVaultPath);

  return (
    <div className="vault-layout">
      {/* Sidebar */}
      <aside className="vault-sidebar">
        <VaultScanner
          initialPath={scanConfig?.vaultPath ?? initialVaultPath}
          isConfigured={isConfigured}
          onScanComplete={handleScanComplete}
        />

        {notes.length > 0 && (
          <nav className="vault-sidebar-nav" aria-label="Topics">
            <button
              type="button"
              onClick={() => setActiveTopic(ALL_TOPICS)}
              className={[
                "vault-sidebar-item",
                activeTopic === ALL_TOPICS ? "vault-sidebar-item-active" : "",
              ].filter(Boolean).join(" ")}
              aria-pressed={activeTopic === ALL_TOPICS}
            >
              <span>All notes</span>
              <span className="vault-sidebar-count">{notes.length}</span>
            </button>

            <div className="vault-sidebar-divider" />

            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveTopic(topic)}
                className={[
                  "vault-sidebar-item",
                  activeTopic === topic ? "vault-sidebar-item-active" : "",
                ].filter(Boolean).join(" ")}
                aria-pressed={activeTopic === topic}
              >
                <span className="truncate">{topic}</span>
                <span className="vault-sidebar-count">{topicCounts[topic] ?? 0}</span>
              </button>
            ))}
          </nav>
        )}

        {scanConfig && (
          <p className="silence-meta silence-meta-faint mt-auto pt-4 leading-relaxed">
            {scanConfig.notesCount} notes<br />
            {scanConfig.topics.length} topics
          </p>
        )}
      </aside>

      {/* Main content */}
      <div className="vault-main">
        {notes.length > 0 && (
          <div className="vault-search-wrap">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="vault-search-input"
              aria-label="Search notes"
            />
            {search && (
              <span className="silence-meta silence-meta-faint">
                {filteredNotes.length} result{filteredNotes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {!isConfigured ? (
          <p className="silence-meta silence-meta-faint py-12 text-center">
            Set your vault path above to get started.
          </p>
        ) : (
          <DashboardGrid
            notes={filteredNotes}
            showTopic={activeTopic === ALL_TOPICS}
          />
        )}
      </div>
    </div>
  );
}
