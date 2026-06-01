import Link from "next/link";

export default function NoteNotFound() {
  return (
    <main className="silence-page note-view min-h-full">
      <Link href="/" prefetch={false} className="silence-meta inline-block mb-8">
        ← Back to Dashboard
      </Link>
      <article className="silence-surface soft-glow mx-auto w-full max-w-3xl p-12 text-center">
        <p className="silence-meta mb-2">404</p>
        <h1 className="silence-heading text-lg">Note not found</h1>
        <p className="silence-meta mt-4">This file is not in the vault at the expected path.</p>
      </article>
    </main>
  );
}
