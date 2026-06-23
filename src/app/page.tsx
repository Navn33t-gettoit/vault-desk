import { DashboardWorkspace } from "@/components/DashboardWorkspace";
import { getConfiguredVaultPath } from "@/lib/vault-config.server";
import { scanVault } from "@/lib/vault-scan";
import type { DashboardNote } from "@/lib/note-display";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Home() {
  const vaultPath = await getConfiguredVaultPath();

  let initialNotes: DashboardNote[] = [];

  if (vaultPath) {
    try {
      const result = await scanVault(vaultPath);
      initialNotes = result.notes.map((note) => ({
        slug: note.slug,
        updatedAt: note.updatedAt,
        topic: note.topic,
        title: note.title,
        relativePath: note.relativePath,
        preview: note.preview,
      }));
    } catch {
      // Vault path configured but not reachable — start with empty list
    }
  }

  return (
    <main className="vault-page min-h-full">
      <DashboardWorkspace
        initialNotes={initialNotes}
        initialVaultPath={vaultPath}
      />
    </main>
  );
}
