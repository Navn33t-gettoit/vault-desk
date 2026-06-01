"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

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
  const lastSaved = useRef(initialContent);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewHtml = useMemo(() => renderMarkdown(content), [content]);

  const toggleMode = useCallback(() => {
    setMode((current) => (current === "edit" ? "preview" : "edit"));
  }, []);

  const save = useCallback(async () => {
    if (content === lastSaved.current) return;

    setSaveState("saving");

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content }),
      });

      if (!response.ok) throw new Error("Save failed");

      lastSaved.current = content;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [content, slug]);

  useEffect(() => {
    if (content === lastSaved.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      void save();
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, save]);

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
          : content !== lastSaved.current
            ? "Unsaved changes"
            : "⌘S to save";

  return (
    <div className="relative z-10 w-full">
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="silence-meta opacity-60">
          {statusLabel}
          {mode === "preview" && (
            <span className="ml-3 opacity-70">· Esc to edit</span>
          )}
          {mode === "edit" && (
            <span className="ml-3 opacity-70">· Esc to preview</span>
          )}
        </span>
        <button
          type="button"
          onClick={toggleMode}
          className="silence-meta soft-glow rounded-sm border border-[var(--silence-border)] px-2.5 py-1 transition-opacity hover:opacity-90"
          aria-pressed={mode === "preview"}
        >
          {mode === "edit" ? "Preview" : "Edit"}
        </button>
      </div>

      {mode === "edit" ? (
        <textarea
          className="relative z-10 block w-full min-h-[70vh] resize-none border-none bg-transparent font-mono text-lg leading-relaxed text-neutral-200 outline-none caret-[rgba(255,191,0,0.55)]"
          value={content}
          readOnly={saveState === "saving"}
          onChange={(event) => {
            setSaveState("idle");
            setContent(event.target.value);
          }}
          spellCheck={false}
          aria-label="Note content"
          aria-busy={saveState === "saving"}
        />
      ) : (
        <div
          className="silence-prose relative z-10 min-h-[70vh] w-full text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  );
}
