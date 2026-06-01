import fs from "fs/promises";
import path from "path";

export const VAULT_PATH = "/Users/navn33t/Desktop";

const SKIP_DIRS = new Set([".obsidian", "node_modules", ".git"]);

export type VaultNote = {
  slug: string;
  updatedAt: Date;
};

function isMarkdownFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".md");
}

function shouldSkipEntry(name: string, isDirectory: boolean): boolean {
  if (name === ".DS_Store") return true;
  if (isDirectory) return SKIP_DIRS.has(name);
  return false;
}

function normalizeSlug(rawSlug: string): string {
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
    if (slug.includes("%")) {
      slug = decodeURIComponent(slug);
    }
  } catch {
    slug = rawSlug;
  }
  return slug;
}

/** Recursively scan a directory and return all markdown files found beneath it. */
async function scanDirectory(
  absoluteDir: string,
  relativePrefix = "",
): Promise<VaultNote[]> {
  const found: VaultNote[] = [];

  let entries: string[];
  try {
    entries = await fs.readdir(absoluteDir);
  } catch (error) {
    console.error(`[vault] readdir failed for "${absoluteDir}":`, error);
    return found;
  }

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = relativePrefix ? `${relativePrefix}/${entry}` : entry;

    let stat;
    try {
      stat = await fs.stat(absolutePath);
    } catch {
      continue;
    }

    if (shouldSkipEntry(entry, stat.isDirectory())) continue;

    if (stat.isDirectory()) {
      const nested = await scanDirectory(absolutePath, relativePath);
      found.push(...nested);
      continue;
    }

    if (isMarkdownFile(entry)) {
      found.push({
        slug: relativePath.replace(/\.md$/i, ""),
        updatedAt: stat.mtime,
      });
    }
  }

  return found;
}

export async function getLatestNotes(): Promise<VaultNote[]> {
  console.log("Searching vault path:", VAULT_PATH);

  try {
    const rootItems = await fs.readdir(VAULT_PATH);
    console.log("All items in root:", rootItems);

    const notes = await scanDirectory(VAULT_PATH);
    const sorted = notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    console.log(`[vault] Found ${sorted.length} markdown file(s)`);
    return sorted;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[vault] Failed to read vault directory:", message);
    console.error("[vault] Full error:", error);
    return [];
  }
}

export type VaultNoteContent = {
  title: string;
  content: string;
};

export async function getNoteBySlug(rawSlug: string): Promise<VaultNoteContent | null> {
  const slug = normalizeSlug(rawSlug);
  const filePath = resolveNoteFilePath(slug);
  if (!filePath) return null;

  try {
    const content = await fs.readFile(filePath, "utf8");
    const title = slug.split("/").pop() ?? slug;
    return { title, content };
  } catch {
    return null;
  }
}

/** Resolve slug to an absolute .md path inside VAULT_PATH, or null if invalid. */
export function resolveNoteFilePath(rawSlug: string): string | null {
  const slug = normalizeSlug(rawSlug);
  if (!slug || slug.includes("..")) return null;

  const filePath = path.resolve(VAULT_PATH, `${slug}.md`);
  const vaultRoot = path.resolve(VAULT_PATH);

  if (filePath !== vaultRoot && !filePath.startsWith(`${vaultRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
}

export async function saveNoteBySlug(rawSlug: string, content: string): Promise<boolean> {
  const filePath = resolveNoteFilePath(rawSlug);
  if (!filePath) return false;

  try {
    await fs.access(filePath);
    await fs.writeFile(filePath, content, "utf8");
    return true;
  } catch {
    return false;
  }
}
