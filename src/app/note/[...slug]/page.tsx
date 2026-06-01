import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteEditor } from "@/components/NoteEditor";
import { getNoteBySlug } from "@/lib/vault";

function displayTitle(slug: string): string {
  const filename = slug.split("/").pop() ?? slug;
  return filename.replace(/\.md$/i, "");
}

function parentContext(slug: string): string | null {
  const parts = slug.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return parts[parts.length - 2];
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function NotePage({ params }: Props) {
  const { slug: slugParts } = await params;
  const slug = slugParts.map(decodeURIComponent).join("/");
  const note = await getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  return (
    <main className="silence-page note-view min-h-full w-full">
      <nav className="mb-[var(--silence-pad-section)]">
        <Link
          href="/"
          prefetch={false}
          className="silence-meta inline-block transition-opacity hover:opacity-80"
        >
          ← Back to Dashboard
        </Link>
      </nav>

      <article className="silence-surface soft-glow relative w-full">
        <header className="mb-[var(--silence-pad-section)] border-b border-[var(--silence-border)] pb-[var(--silence-pad-section)]">
          {parentContext(slug) && (
            <p className="silence-meta silence-meta-faint mb-2">
              {parentContext(slug)}
            </p>
          )}
          <p className="silence-meta mb-2">Note · editable</p>
          <h1 className="silence-heading font-mono text-xl tracking-wide">
            {displayTitle(slug)}
          </h1>
        </header>
        <section className="relative w-full">
          <NoteEditor slug={slug} initialContent={note.content} />
        </section>
      </article>
    </main>
  );
}
