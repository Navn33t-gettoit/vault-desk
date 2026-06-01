import { NextResponse } from "next/server";
import { saveNoteBySlug } from "@/lib/vault";

export const dynamic = "force-dynamic";

type SaveBody = {
  slug?: string;
  content?: string;
};

export async function POST(request: Request) {
  let body: SaveBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, content } = body;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  const saved = await saveNoteBySlug(slug, content);

  if (!saved) {
    return NextResponse.json({ error: "Failed to save note" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
