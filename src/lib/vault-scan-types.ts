export const ROOT_TOPIC = "Root";

export type ScannedNote = {
  title: string;
  slug: string;
  topic: string;
  relativePath: string;
  updatedAt: string;
};

export type VaultScanResult = {
  success: true;
  topics: string[];
  notesCount: number;
  notes: ScannedNote[];
};

export function deriveTopic(relativePath: string): string {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.length <= 1) return ROOT_TOPIC;
  return segments[0];
}

export function titleFromRelativePath(relativePath: string): string {
  const filename = relativePath.split("/").pop() ?? relativePath;
  return filename.replace(/\.md$/i, "");
}

export function sortTopics(topics: string[]): string[] {
  const unique = [...new Set(topics)];
  return unique.sort((a, b) => {
    if (a === ROOT_TOPIC) return -1;
    if (b === ROOT_TOPIC) return 1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}
