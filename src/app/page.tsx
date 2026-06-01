import Link from "next/link";
import { getLatestNotes } from "@/lib/vault";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function formatUpdatedAt(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function noteHref(slug: string): string {
  return `/note/${slug.split("/").map(encodeURIComponent).join("/")}`;
}

function displayTitle(slug: string): string {
  const filename = slug.split("/").pop() ?? slug;
  return filename.replace(/\.md$/i, "");
}

function parentContext(slug: string): string | null {
  const parts = slug.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return parts[parts.length - 2];
}

export default async function Home() {
  const notes = await getLatestNotes();

  return (
    <main className="silence-page min-h-full">
      <header className="silence-section pb-0">
        <p className="silence-meta mb-3">Navn33t OS · reading surface</p>
        <h1 className="text-2xl font-normal tracking-wide text-[var(--silence-text)]">
          Vault Desk
        </h1>
      </header>

      <section className="silence-section pt-[var(--silence-pad-section)]">
        {notes.length === 0 ? (
          <p className="silence-meta py-[var(--silence-pad-page)] text-center">
            No notes found. Check VAULT_PATH in src/lib/vault.ts
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-[var(--silence-pad-inline)] sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <li key={note.slug}>
                <Link href={noteHref(note.slug)} prefetch={false} className="block h-full">
                  <article className="silence-surface soft-glow h-full transition-opacity hover:opacity-95">
                    {parentContext(note.slug) && (
                      <p className="silence-meta mb-2 opacity-50">{parentContext(note.slug)}</p>
                    )}
                    <h2 className="text-base font-normal tracking-wide text-[var(--silence-text)]">
                      {displayTitle(note.slug)}
                    </h2>
                    <p className="silence-meta mt-4">{formatUpdatedAt(note.updatedAt)}</p>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
