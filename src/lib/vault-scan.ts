import fs from "fs/promises";
import path from "path";
import {
  type ScannedNote,
  type VaultScanResult,
  deriveTopic,
  sortTopics,
  titleFromRelativePath,
} from "@/lib/vault-scan-types";

const SKIP_DIRS = new Set([".obsidian", ".git", "node_modules"]);

// In-process preview cache: slug -> { mtime, preview }
// Cleared only when the process restarts. Keeps repeat scans fast.
const previewCache = new Map<string, { mtime: number; preview: string }>();

function isMarkdownFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".md");
}

function shouldSkipEntry(name: string, isDirectory: boolean): boolean {
  if (name === ".DS_Store") return true;
  if (name.startsWith(".")) return true;
  if (isDirectory && SKIP_DIRS.has(name)) return true;
  return false;
}

async function extractPreview(filePath: string, slug: string, mtime: number): Promise<string> {
  const cached = previewCache.get(slug);
  if (cached && cached.mtime === mtime) return cached.preview;

  let preview = "";
  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split("\n");
    let inFrontmatter = false;
    let frontmatterSeen = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!frontmatterSeen && trimmed === "---") {
        inFrontmatter = true;
        frontmatterSeen = true;
        continue;
      }
      if (inFrontmatter) {
        if (trimmed === "---") inFrontmatter = false;
        continue;
      }
      if (!trimmed || trimmed.startsWith("#") || /^[-*]{3,}$/.test(trimmed)) continue;

      const clean = trimmed
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
        .replace(/[*_`~]+/g, "")
        .replace(/^[-*+>]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .trim();

      if (clean.length > 12) {
        preview = clean.length > 120 ? `${clean.slice(0, 120)}…` : clean;
        break;
      }
    }
  } catch {}

  previewCache.set(slug, { mtime, preview });
  return preview;
}

export function validateVaultPath(vaultPath: string): string | null {
  if (!vaultPath || typeof vaultPath !== "string") return null;
  const resolved = path.resolve(vaultPath.trim());
  return resolved;
}

export async function assertVaultDirectory(
  vaultPath: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const resolved = validateVaultPath(vaultPath);
  if (!resolved) return { ok: false, error: "Invalid vault path" };

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) return { ok: false, error: "Path is not a directory" };
  } catch {
    return { ok: false, error: "Vault directory not found or not readable" };
  }

  return { ok: true, path: resolved };
}

async function scanDirectory(
  absoluteDir: string,
  relativePrefix = "",
): Promise<ScannedNote[]> {
  const found: ScannedNote[] = [];

  let entries: string[];
  try {
    entries = await fs.readdir(absoluteDir);
  } catch {
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
      found.push(...(await scanDirectory(absolutePath, relativePath)));
      continue;
    }

    if (!isMarkdownFile(entry)) continue;

    const topic = deriveTopic(relativePath);
    const slug = relativePath.replace(/\.md$/i, "");
    const mtime = stat.mtimeMs;
    const preview = await extractPreview(absolutePath, slug, mtime);

    found.push({
      title: titleFromRelativePath(relativePath),
      slug,
      topic,
      relativePath,
      updatedAt: stat.mtime.toISOString(),
      preview,
    });
  }

  return found;
}

export async function scanVault(vaultPath: string): Promise<VaultScanResult> {
  const validation = await assertVaultDirectory(vaultPath);
  if (!validation.ok) throw new Error(validation.error);

  const notes = await scanDirectory(validation.path);
  notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    success: true,
    topics: sortTopics(notes.map((n) => n.topic)),
    notesCount: notes.length,
    notes,
  };
}
