import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardGrid } from "@/components/DashboardGrid";
import { getLatestNotes } from "@/lib/vault";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Home() {
  const notes = await getLatestNotes();
  const serializedNotes = notes.map((note) => ({
    slug: note.slug,
    updatedAt: note.updatedAt.toISOString(),
  }));

  return (
    <main className="silence-page min-h-full">
      <DashboardHeader />

      <section className="silence-section pt-[var(--silence-pad-section)]">
        <p className="silence-meta silence-meta-faint mb-4">
          Drag to reorder · drop onto a card to bundle into a sub-vault
        </p>
        <DashboardGrid notes={serializedNotes} />
      </section>
    </main>
  );
}
