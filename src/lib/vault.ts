import fs from "fs/promises";
import path from "path";
import { getConfiguredVaultPath } from "@/lib/vault-config.server";

export type VaultNoteContent = {
  title: string;
  content: string;
};

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

  const vaultRoot = path.resolve(await getConfiguredVaultPath());
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
