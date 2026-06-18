import fs from "fs/promises";
import path from "path";
import { getConfiguredVaultPath } from "@/lib/vault-config.server";

/** @deprecated Use runtime config from initialization scan. Fallback default only. */
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
  if (name.startsWith(".")) return true;
  if (isDirectory && SKIP_DIRS.has(name)) return true;
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

async function getVaultRoot(): Promise<string> {
  return getConfiguredVaultPath();
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
  const vaultRoot = await getVaultRoot();
  if (!vaultRoot) return [];

  try {
    const notes = await scanDirectory(vaultRoot);
    return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch {
    return [];
  }
}

export type VaultNoteContent = {
  title: string;
  content: string;
};

export async function getNoteBySlug(rawSlug: string): Promise<VaultNoteContent | null> {
  const slug = normalizeSlug(rawSlug);
  const filePath = await resolveNoteFilePath(slug);
  if (!filePath) return null;

  try {
    const content = await fs.readFile(filePath, "utf8");
    const title = slug.split("/").pop() ?? slug;
    return { title, content };
  } catch {
    return null;
  }
}

/** Resolve slug to an absolute .md path inside the configured vault, or null if invalid. */
export async function resolveNoteFilePath(rawSlug: string): Promise<string | null> {
  const slug = normalizeSlug(rawSlug);
  if (!slug || slug.includes("..")) return null;

  const vaultRoot = path.resolve(await getVaultRoot());
  const filePath = path.resolve(vaultRoot, `${slug}.md`);

  if (filePath !== vaultRoot && !filePath.startsWith(`${vaultRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
}

export async function saveNoteBySlug(rawSlug: string, content: string): Promise<boolean> {
  const filePath = await resolveNoteFilePath(rawSlug);
  if (!filePath) return false;

  try {
    await fs.access(filePath);
    await fs.writeFile(filePath, content, "utf8");
    return true;
  } catch {
    return false;
  }
}
