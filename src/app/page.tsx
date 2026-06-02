import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardWorkspace } from "@/components/DashboardWorkspace";
import { getConfiguredVaultPath } from "@/lib/vault-config.server";
import { deriveTopic } from "@/lib/vault-scan-types";
import { getLatestNotes } from "@/lib/vault";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Home() {
  const [notes, vaultPath] = await Promise.all([
    getLatestNotes(),
    getConfiguredVaultPath(),
  ]);

  const serializedNotes = notes.map((note) => ({
    slug: note.slug,
    updatedAt: note.updatedAt.toISOString(),
    topic: deriveTopic(`${note.slug}.md`),
    title: note.slug.split("/").pop()?.replace(/\.md$/i, "") ?? note.slug,
    relativePath: `${note.slug}.md`,
  }));

  return (
    <main className="silence-page min-h-full">
      <DashboardHeader />

      <section className="silence-section pt-[var(--silence-pad-section)]">
        <DashboardWorkspace
          initialNotes={serializedNotes}
          initialVaultPath={vaultPath}
        />
      </section>
    </main>
  );
}
