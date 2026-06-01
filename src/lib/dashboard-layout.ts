import type { DashboardNote } from "@/lib/note-display";
import { displayTitle, folderLabelFromSlug } from "@/lib/note-display";

export const DASHBOARD_LAYOUT_KEY = "vault-desk-dashboard-layout";

export type LayoutNote = {
  kind: "note";
  slug: string;
};

export type LayoutFolder = {
  kind: "folder";
  id: string;
  name: string;
  children: LayoutNode[];
};

export type LayoutNode = LayoutNote | LayoutFolder;

export type DashboardLayout = {
  version: 1;
  nodes: LayoutNode[];
};

export function noteNodeId(slug: string): string {
  return `note:${slug}`;
}

export function folderNodeId(id: string): string {
  return `folder:${id}`;
}

export function nestTargetId(nodeId: string): string {
  return `nest:${nodeId}`;
}

export function parseNodeId(id: string): { kind: "note"; slug: string } | { kind: "folder"; id: string } | null {
  if (id.startsWith("note:")) {
    return { kind: "note", slug: id.slice(5) };
  }
  if (id.startsWith("folder:")) {
    return { kind: "folder", id: id.slice(7) };
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

function collectNoteSlugs(nodes: LayoutNode[], slugs = new Set<string>()): Set<string> {
  for (const node of nodes) {
    if (node.kind === "note") slugs.add(node.slug);
    else collectNoteSlugs(node.children, slugs);
  }
  return slugs;
}

function pruneNodes(nodes: LayoutNode[], validSlugs: Set<string>): LayoutNode[] {
  const pruned: LayoutNode[] = [];

  for (const node of nodes) {
    if (node.kind === "note") {
      if (validSlugs.has(node.slug)) pruned.push(node);
      continue;
    }

    const children = pruneNodes(node.children, validSlugs);
    if (children.length > 0) {
      pruned.push({ ...node, children });
    }
  }

  return pruned;
}

export function mergeLayoutWithNotes(
  layout: DashboardLayout | null,
  notes: DashboardNote[],
): DashboardLayout {
  const validSlugs = new Set(notes.map((note) => note.slug));
  const base = layout ?? createDefaultLayout(notes);
  const nodes = pruneNodes(base.nodes, validSlugs);
  const used = collectNoteSlugs(nodes);

  for (const note of notes) {
    if (!used.has(note.slug)) {
      nodes.push({ kind: "note", slug: note.slug });
    }
  }

  return { version: 1, nodes };
}

type ExtractResult = {
  node: LayoutNode | null;
  nodes: LayoutNode[];
};

function extractNode(nodes: LayoutNode[], nodeId: string): ExtractResult {
  const parsed = parseNodeId(nodeId);
  if (!parsed) return { node: null, nodes };

  const next: LayoutNode[] = [];
  let extracted: LayoutNode | null = null;

  for (const node of nodes) {
    if (node.kind === "note" && parsed.kind === "note" && node.slug === parsed.slug) {
      extracted = node;
      continue;
    }

    if (node.kind === "folder" && parsed.kind === "folder" && node.id === parsed.id) {
      extracted = node;
      continue;
    }

    if (node.kind === "folder") {
      const nested = extractNode(node.children, nodeId);
      if (nested.node) extracted = nested.node;
      next.push({ ...node, children: nested.nodes });
      continue;
    }

    next.push(node);
  }

  return { node: extracted, nodes: next };
}

function containsNodeId(node: LayoutNode, nodeId: string): boolean {
  const parsed = parseNodeId(nodeId);
  if (!parsed) return false;

  if (node.kind === "note" && parsed.kind === "note") return node.slug === parsed.slug;
  if (node.kind === "folder" && parsed.kind === "folder") return node.id === parsed.id;

  if (node.kind === "folder") {
    return node.children.some((child) => containsNodeId(child, nodeId));
  }

  return false;
}

function insertIntoTarget(
  nodes: LayoutNode[],
  incoming: LayoutNode,
  targetNodeId: string,
): LayoutNode[] {
  const parsed = parseNodeId(targetNodeId);
  if (!parsed) return nodes;

  const next: LayoutNode[] = [];

  for (const node of nodes) {
    if (node.kind === "note" && parsed.kind === "note" && node.slug === parsed.slug) {
      const folderId = crypto.randomUUID();
      next.push({
        kind: "folder",
        id: folderId,
        name: folderLabelFromSlug(node.slug),
        children: [node, incoming],
      });
      continue;
    }

    if (node.kind === "folder" && parsed.kind === "folder" && node.id === parsed.id) {
      next.push({ ...node, children: [...node.children, incoming] });
      continue;
    }

    if (node.kind === "folder") {
      next.push({
        ...node,
        children: insertIntoTarget(node.children, incoming, targetNodeId),
      });
      continue;
    }

    next.push(node);
  }

  return next;
}

export function nestNodeInto(
  layout: DashboardLayout,
  activeNodeId: string,
  targetNodeId: string,
): DashboardLayout {
  if (activeNodeId === targetNodeId) return layout;

  const { node, nodes } = extractNode(layout.nodes, activeNodeId);
  if (!node) return layout;

  if (node.kind === "folder" && containsNodeId(node, targetNodeId)) {
    return layout;
  }

  return {
    version: 1,
    nodes: insertIntoTarget(nodes, node, targetNodeId),
  };
}

function findParentList(
  nodes: LayoutNode[],
  nodeId: string,
  trail: LayoutNode[] = nodes,
): LayoutNode[] | null {
  for (const node of nodes) {
    const parsed = parseNodeId(nodeId);
    if (!parsed) return null;

    if (node.kind === "note" && parsed.kind === "note" && node.slug === parsed.slug) {
      return trail;
    }
    if (node.kind === "folder" && parsed.kind === "folder" && node.id === parsed.id) {
      return trail;
    }
    if (node.kind === "folder") {
      const found = findParentList(node.children, nodeId, node.children);
      if (found) return found;
    }
  }
  return null;
}

function replaceList(
  nodes: LayoutNode[],
  targetList: LayoutNode[],
  replacement: LayoutNode[],
): LayoutNode[] {
  if (nodes === targetList) return replacement;

  return nodes.map((node) => {
    if (node.kind !== "folder") return node;
    if (node.children === targetList) {
      return { ...node, children: replacement };
    }
    return {
      ...node,
      children: replaceList(node.children, targetList, replacement),
    };
  });
}

export function reorderInLayout(
  layout: DashboardLayout,
  activeNodeId: string,
  overNodeId: string,
): DashboardLayout {
  if (activeNodeId === overNodeId) return layout;

  const activeParent = findParentList(layout.nodes, activeNodeId);
  const overParent = findParentList(layout.nodes, overNodeId);
  if (!activeParent || !overParent || activeParent !== overParent) return layout;

  const oldIndex = activeParent.findIndex((node) => {
    const parsedActive = parseNodeId(activeNodeId);
    if (!parsedActive) return false;
    if (node.kind === "note" && parsedActive.kind === "note") return node.slug === parsedActive.slug;
    if (node.kind === "folder" && parsedActive.kind === "folder") return node.id === parsedActive.id;
    return false;
  });

  const newIndex = activeParent.findIndex((node) => {
    const parsedOver = parseNodeId(overNodeId);
    if (!parsedOver) return false;
    if (node.kind === "note" && parsedOver.kind === "note") return node.slug === parsedOver.slug;
    if (node.kind === "folder" && parsedOver.kind === "folder") return node.id === parsedOver.id;
    return false;
  });

  if (oldIndex < 0 || newIndex < 0) return layout;

  const reordered = [...activeParent];
  const [moved] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, moved);

  return {
    version: 1,
    nodes: replaceList(layout.nodes, activeParent, reordered),
  };
}

export function flattenNodeIds(nodes: LayoutNode[]): string[] {
  const ids: string[] = [];

  for (const node of nodes) {
    if (node.kind === "note") ids.push(noteNodeId(node.slug));
    else {
      ids.push(folderNodeId(node.id));
      ids.push(...flattenNodeIds(node.children));
    }
  }

  return ids;
}

export function getNodeLabel(node: LayoutNode): string {
  if (node.kind === "note") return displayTitle(node.slug);
  return node.name;
}
