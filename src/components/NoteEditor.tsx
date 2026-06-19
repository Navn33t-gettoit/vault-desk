"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { TextSizeToggle } from "@/components/TextSizeToggle";
import {
  computeMarkdownStats,
  formatMarkdownStats,
} from "@/lib/markdown-stats";

type NoteEditorProps = {
  slug: string;
  initialContent: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type ViewMode = "edit" | "preview";

export function NoteEditor({ slug, initialContent }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<ViewMode>("edit");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState(initialContent);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stats = useMemo(() => computeMarkdownStats(content), [content]);
  const statsLabel = useMemo(() => formatMarkdownStats(stats), [stats]);
  const previewHtml = useMemo(() => renderMarkdown(content), [content]);

  const toggleMode = useCallback(() => {
    setMode((current) => (current === "edit" ? "preview" : "edit"));
  }, []);

  const save = useCallback(async () => {
    if (content === lastSaved) return;

    setSaveState("saving");

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content }),
      });

      if (!response.ok) throw new Error("Save failed");

      setLastSaved(content);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [content, lastSaved, slug]);

  useEffect(() => {
    if (content === lastSaved) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      void save();
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, lastSaved, save]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void save();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        toggleMode();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save, toggleMode]);

  const statusLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : content !== lastSaved
            ? "Unsaved changes"
            : "⌘S to save";

  return (
    <>
      <div className="relative z-10 w-full pb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="silence-meta silence-meta-faint">
            {statusLabel}
            <span className="ml-3">
              · Esc to {mode === "edit" ? "preview" : "edit"}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <TextSizeToggle />
            <button
              type="button"
              onClick={toggleMode}
              className="silence-chip soft-glow"
              aria-pressed={mode === "preview"}
            >
              {mode === "edit" ? "Preview" : "Edit"}
            </button>
          </div>
        </div>

        {mode === "edit" ? (
          <textarea
            className="silence-editor-input relative z-10 block w-full min-h-[70vh] resize-none border-none bg-transparent outline-none"
            value={content}
            readOnly={saveState === "saving"}
            onChange={(event) => {
              setSaveState("idle");
              setContent(event.target.value);
            }}
            onFocus={() => document.body.classList.add("writing-mode")}
            onBlur={() => document.body.classList.remove("writing-mode")}
            spellCheck={false}
            aria-label="Note content"
            aria-busy={saveState === "saving"}
          />
        ) : (
          <div
            className="silence-prose relative z-10 min-h-[70vh] w-full"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>

      <footer className="silence-status-bar">
        <span className="silence-meta silence-meta-faint">{statsLabel}</span>
      </footer>
    </>
  );
}
