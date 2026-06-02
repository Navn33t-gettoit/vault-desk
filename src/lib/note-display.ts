export type DashboardNote = {
  slug: string;
  updatedAt: string;
  title?: string;
  topic?: string;
  relativePath?: string;
};

export function noteHref(slug: string): string {
  return `/note/${slug.split("/").map(encodeURIComponent).join("/")}`;
}

export function displayTitle(slug: string): string {
  const filename = slug.split("/").pop() ?? slug;
  return filename.replace(/\.md$/i, "");
}

export function parentContext(slug: string): string | null {
  const parts = slug.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return parts[parts.length - 2];
}

export function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function folderLabelFromSlug(slug: string): string {
  return `${displayTitle(slug)} vault`;
}
