"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type DashboardLayout,
  type LayoutFolder,
  type LayoutNode,
  flattenNodeIds,
  folderNodeId,
  loadDashboardLayout,
  mergeLayoutWithNotes,
  nestNodeInto,
  nestTargetId,
  noteNodeId,
  reorderInLayout,
  saveDashboardLayout,
} from "@/lib/dashboard-layout";
import {
  type DashboardNote,
  displayTitle,
  formatUpdatedAt,
  noteHref,
  parentContext,
} from "@/lib/note-display";

type DashboardGridProps = {
  notes: DashboardNote[];
};

type SortableNodeProps = {
  node: LayoutNode;
  noteMap: Map<string, DashboardNote>;
  depth?: number;
};

function combineRefs<T>(...refs: Array<(node: T | null) => void>) {
  return (node: T | null) => {
    refs.forEach((ref) => ref(node));
  };
}

function NoteCardContent({
  slug,
  note,
  isDragging,
  isNestTarget,
}: {
  slug: string;
  note?: DashboardNote;
  isDragging?: boolean;
  isNestTarget?: boolean;
}) {
  return (
    <article
      className={[
        "silence-surface soft-glow h-full transition-all duration-200",
        isDragging ? "dashboard-dnd-dragging" : "hover:opacity-95",
        isNestTarget ? "dashboard-dnd-nest-target" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {parentContext(slug) && (
        <p className="silence-meta silence-meta-faint mb-2">{parentContext(slug)}</p>
      )}
      {note?.topic && note.topic !== "Root" && (
        <p className="silence-meta silence-meta-faint mb-2">{note.topic}</p>
      )}
      <h2 className="silence-heading text-base tracking-wide">
        {note?.title ?? displayTitle(slug)}
      </h2>
      {note && (
        <p className="silence-meta mt-4">{formatUpdatedAt(note.updatedAt)}</p>
      )}
    </article>
  );
}

function SortableNoteCard({
  slug,
  noteMap,
  depth = 0,
}: {
  slug: string;
  noteMap: Map<string, DashboardNote>;
  depth?: number;
}) {
  const id = noteNodeId(slug);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const { setNodeRef: setNestRef, isOver } = useDroppable({
    id: nestTargetId(id),
    data: { type: "nest", nodeId: id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const note = noteMap.get(slug);

  return (
    <li
      ref={combineRefs(setNodeRef, setNestRef)}
      style={style}
      className={[
        "list-none",
        depth > 0 ? "dashboard-dnd-nested-item" : "",
        isDragging ? "dashboard-dnd-source-hidden" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="dashboard-dnd-card relative h-full"
        {...attributes}
        {...listeners}
      >
        <Link href={noteHref(slug)} prefetch={false} className="block h-full" draggable={false}>
          <NoteCardContent
            slug={slug}
            note={note}
            isDragging={isDragging}
            isNestTarget={isOver && !isDragging}
          />
        </Link>
      </div>
    </li>
  );
}

function SortableFolderCard({
  folder,
  noteMap,
  depth = 0,
}: {
  folder: LayoutFolder;
  noteMap: Map<string, DashboardNote>;
  depth?: number;
}) {
  const id = folderNodeId(folder.id);
  const childIds = flattenNodeIds(folder.children);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const { setNodeRef: setNestRef, isOver } = useDroppable({
    id: nestTargetId(id),
    data: { type: "nest", nodeId: id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={combineRefs(setNodeRef, setNestRef)}
      style={style}
      className={[
        "list-none",
        depth > 0 ? "dashboard-dnd-nested-item" : "",
        isDragging ? "dashboard-dnd-source-hidden" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "dashboard-folder dashboard-dnd-card silence-surface soft-glow h-full transition-all duration-200",
          isOver && !isDragging ? "dashboard-dnd-nest-target" : "",
          isDragging ? "dashboard-dnd-dragging" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...attributes}
        {...listeners}
      >
        <div className="mb-4">
          <p className="silence-meta silence-meta-faint mb-1">Sub-vault</p>
          <h2 className="silence-heading text-base tracking-wide">{folder.name}</h2>
        </div>
        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          <ul className="dashboard-folder-children">
            {folder.children.map((child) => (
              <SortableLayoutNode
                key={child.kind === "note" ? noteNodeId(child.slug) : folderNodeId(child.id)}
                node={child}
                noteMap={noteMap}
                depth={depth + 1}
              />
            ))}
          </ul>
        </SortableContext>
      </div>
    </li>
  );
}

function SortableLayoutNode({ node, noteMap, depth = 0 }: SortableNodeProps) {
  if (node.kind === "note") {
    return <SortableNoteCard slug={node.slug} noteMap={noteMap} depth={depth} />;
  }
  return <SortableFolderCard folder={node} noteMap={noteMap} depth={depth} />;
}

function DragPreview({
  node,
  noteMap,
}: {
  node: LayoutNode;
  noteMap: Map<string, DashboardNote>;
}) {
  if (node.kind === "note") {
    return (
      <div className="dashboard-dnd-overlay">
        <NoteCardContent slug={node.slug} note={noteMap.get(node.slug)} />
      </div>
    );
  }

  return (
    <div className="dashboard-dnd-overlay dashboard-folder silence-surface soft-glow p-4">
      <p className="silence-meta silence-meta-faint mb-1">Sub-vault</p>
      <h2 className="silence-heading text-base tracking-wide">{node.name}</h2>
      <p className="silence-meta mt-2">{node.children.length} item(s)</p>
    </div>
  );
}

function findNode(nodes: LayoutNode[], nodeId: string): LayoutNode | null {
  for (const node of nodes) {
    if (node.kind === "note" && nodeId === noteNodeId(node.slug)) return node;
    if (node.kind === "folder") {
      if (nodeId === folderNodeId(node.id)) return node;
      const nested = findNode(node.children, nodeId);
      if (nested) return nested;
    }
  }
  return null;
}

export function DashboardGrid({ notes }: DashboardGridProps) {
  const [layout, setLayout] = useState<DashboardLayout>(() =>
    mergeLayoutWithNotes(null, notes),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const noteMap = useMemo(
    () => new Map(notes.map((note) => [note.slug, note])),
    [notes],
  );

  const rootIds = useMemo(
    () =>
      layout.nodes.map((node) =>
        node.kind === "note" ? noteNodeId(node.slug) : folderNodeId(node.id),
      ),
    [layout.nodes],
  );

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
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeNodeId = String(active.id);
    const overId = String(over.id);

    if (overId.startsWith("nest:")) {
      const targetNodeId = overId.slice(5);
      if (activeNodeId !== targetNodeId) {
        setLayout((current) => nestNodeInto(current, activeNodeId, targetNodeId));
      }
      return;
    }

    if (
      (overId.startsWith("note:") || overId.startsWith("folder:")) &&
      activeNodeId !== overId
    ) {
      setLayout((current) => reorderInLayout(current, activeNodeId, overId));
    }
  }

  const activeNode = activeId ? findNode(layout.nodes, activeId) : null;

  if (notes.length === 0) {
    return (
      <p className="silence-meta py-[var(--silence-pad-page)] text-center">
        No notes found. Run an initialization scan above or check your vault path.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rootIds} strategy={rectSortingStrategy}>
        <ul className="dashboard-dnd-grid">
          {layout.nodes.map((node) => (
            <SortableLayoutNode
              key={node.kind === "note" ? noteNodeId(node.slug) : folderNodeId(node.id)}
              node={node}
              noteMap={noteMap}
            />
          ))}
        </ul>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeNode ? <DragPreview node={activeNode} noteMap={noteMap} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
