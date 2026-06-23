import type { DashboardNote } from "@/lib/note-display";
import { displayTitle } from "@/lib/note-display";

export const DASHBOARD_LAYOUT_KEY = "vault-desk-dashboard-layout";

export type LayoutNote = {
  kind: "note";
  slug: string;
};

export type LayoutNode = LayoutNote;

export type DashboardLayout = {
  version: 1;
  nodes: LayoutNode[];
};

export function noteNodeId(slug: string): string {
  return `note:${slug}`;
}

export function parseNodeId(id: string): { kind: "note"; slug: string } | null {
  if (id.startsWith("note:")) {
    return { kind: "note", slug: id.slice(5) };
  }
  return null;
}

export function createDefaultLayout(notes: DashboardNote[]): DashboardLayout {
  return {
    version: 1,
    nodes: notes.map((note) => ({ kind: "note", slug: note.slug })),
  };
}

export function loadDashboardLayout(): DashboardLayout | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(DASHBOARD_LAYOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardLayout;
    if (parsed.version !== 1 || !Array.isArray(parsed.nodes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDashboardLayout(layout: DashboardLayout): void {
  localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(layout));
}

export function mergeLayoutWithNotes(
  layout: DashboardLayout | null,
  notes: DashboardNote[],
): DashboardLayout {
  const validSlugs = new Set(notes.map((note) => note.slug));
  const base = layout ?? createDefaultLayout(notes);

  // Remove stale slugs (notes that no longer exist in the vault)
  const nodes = base.nodes.filter(
    (n) => n.kind === "note" && validSlugs.has(n.slug),
  );

  // Append any new notes not yet in the layout
  const used = new Set(nodes.map((n) => n.slug));
  for (const note of notes) {
    if (!used.has(note.slug)) {
      nodes.push({ kind: "note", slug: note.slug });
    }
  }

  return { version: 1, nodes };
}

export function reorderInLayout(
  layout: DashboardLayout,
  activeNodeId: string,
  overNodeId: string,
): DashboardLayout {
  if (activeNodeId === overNodeId) return layout;

  const oldIndex = layout.nodes.findIndex((n) => noteNodeId(n.slug) === activeNodeId);
  const newIndex = layout.nodes.findIndex((n) => noteNodeId(n.slug) === overNodeId);

  if (oldIndex < 0 || newIndex < 0) return layout;

  const reordered = [...layout.nodes];
  const [moved] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, moved);

  return { version: 1, nodes: reordered };
}

export function flattenNodeIds(nodes: LayoutNode[]): string[] {
  return nodes.map((n) => noteNodeId(n.slug));
}

export function getNodeLabel(node: LayoutNode): string {
  return displayTitle(node.slug);
}
