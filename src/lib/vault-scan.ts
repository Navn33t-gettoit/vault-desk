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

function isMarkdownFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".md");
}

function shouldSkipEntry(name: string, isDirectory: boolean): boolean {
  if (name === ".DS_Store") return true;
  if (name.startsWith(".")) return true;
  if (isDirectory && SKIP_DIRS.has(name)) return true;
  return false;
}

export function validateVaultPath(vaultPath: string): string | null {
  if (!vaultPath || typeof vaultPath !== "string") return null;

  const resolved = path.resolve(vaultPath.trim());
  if (resolved.includes("..")) return null;

  return resolved;
}

export async function assertVaultDirectory(
  vaultPath: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const resolved = validateVaultPath(vaultPath);
  if (!resolved) {
    return { ok: false, error: "Invalid vault path" };
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) {
      return { ok: false, error: "Path is not a directory" };
    }
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

    found.push({
      title: titleFromRelativePath(relativePath),
      slug,
      topic,
      relativePath,
      updatedAt: stat.mtime.toISOString(),
    });
  }

  return found;
}

export async function scanVault(vaultPath: string): Promise<VaultScanResult> {
  const validation = await assertVaultDirectory(vaultPath);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const notes = await scanDirectory(validation.path);
  notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const topics = sortTopics(notes.map((note) => note.topic));

  return {
    success: true,
    topics,
    notesCount: notes.length,
    notes,
  };
}
