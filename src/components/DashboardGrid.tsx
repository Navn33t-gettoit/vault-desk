"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type DashboardLayout,
  loadDashboardLayout,
  mergeLayoutWithNotes,
  noteNodeId,
  reorderInLayout,
  saveDashboardLayout,
} from "@/lib/dashboard-layout";
import {
  type DashboardNote,
  displayTitle,
  formatUpdatedAt,
  noteHref,
} from "@/lib/note-display";
import { ROOT_TOPIC } from "@/lib/vault-scan-types";

function topicHue(topic: string): number {
  let h = 0;
  for (let i = 0; i < topic.length; i++) h = (h * 31 + topic.charCodeAt(i)) & 0xffff;
  return h % 360;
}

type DashboardGridProps = {
  notes: DashboardNote[];
  showTopic?: boolean;
};

function NoteCard({
  note,
  showTopic,
  isDragging,
}: {
  note: DashboardNote;
  showTopic: boolean;
  isDragging?: boolean;
}) {
  const title = note.title ?? displayTitle(note.slug);
  const topic = note.topic && note.topic !== ROOT_TOPIC ? note.topic : null;
  const borderColor = topic
    ? `hsl(${topicHue(topic)}, 45%, 55%)`
    : "transparent";

  return (
    <article
      className={[
        "silence-surface soft-glow h-full flex flex-col justify-between transition-all duration-200",
        isDragging ? "dashboard-dnd-dragging" : "hover:opacity-95",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div>
        {showTopic && topic && (
          <p className="silence-meta silence-meta-faint mb-2">{topic}</p>
        )}
        <h2 className="dashboard-card-title mb-2">{title}</h2>
        {note.preview && (
          <p className="silence-meta silence-meta-faint leading-relaxed line-clamp-2">
            {note.preview}
          </p>
        )}
      </div>
      {note.updatedAt && (
        <p className="silence-meta silence-meta-faint mt-4">{formatUpdatedAt(note.updatedAt)}</p>
      )}
    </article>
  );
}

function SortableNoteCard({
  slug,
  noteMap,
  showTopic,
}: {
  slug: string;
  noteMap: Map<string, DashboardNote>;
  showTopic: boolean;
}) {
  const id = noteNodeId(slug);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const note = noteMap.get(slug) ?? { slug, updatedAt: "" };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={["list-none", isDragging ? "dashboard-dnd-source-hidden" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="dashboard-dnd-card h-full" {...attributes} {...listeners}>
        <Link href={noteHref(slug)} prefetch={false} className="block h-full" draggable={false}>
          <NoteCard note={note} showTopic={showTopic} isDragging={isDragging} />
        </Link>
      </div>
    </li>
  );
}

export function DashboardGrid({ notes, showTopic = true }: DashboardGridProps) {
  const [layout, setLayout] = useState<DashboardLayout>(() =>
    mergeLayoutWithNotes(null, notes),
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const noteMap = useMemo(
    () => new Map(notes.map((note) => [note.slug, note])),
    [notes],
  );

  const noteSlugs = useMemo(
    () =>
      layout.nodes
        .filter((n) => n.kind === "note")
        .map((n) => (n.kind === "note" ? n.slug : "")),
    [layout.nodes],
  );

  const rootIds = useMemo(() => noteSlugs.map(noteNodeId), [noteSlugs]);

  useEffect(() => {
    const saved = loadDashboardLayout();
    setLayout(mergeLayoutWithNotes(saved, notes));
    setReady(true);
  }, [notes]);

  useEffect(() => {
    if (!ready) return;
    saveDashboardLayout(layout);
  }, [layout, ready]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith("note:")) setActiveSlug(id.slice(5));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveSlug(null);
    if (!over || active.id === over.id) return;
    setLayout((current) =>
      reorderInLayout(current, String(active.id), String(over.id)),
    );
  }

  if (notes.length === 0) {
    return (
      <p className="silence-meta silence-meta-faint py-12 text-center">
        No notes found. Try a different search or topic.
      </p>
    );
  }

  const activeNote = activeSlug ? noteMap.get(activeSlug) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rootIds} strategy={rectSortingStrategy}>
        <ul className="dashboard-dnd-grid">
          {noteSlugs.map((slug) => (
            <SortableNoteCard
              key={slug}
              slug={slug}
              noteMap={noteMap}
              showTopic={showTopic}
            />
          ))}
        </ul>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeNote ? (
          <div className="dashboard-dnd-overlay">
            <NoteCard note={activeNote} showTopic={showTopic} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
