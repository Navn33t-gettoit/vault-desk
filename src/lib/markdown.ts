import { marked } from "marked";

const youtubeIdPattern =
  /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/i;

function preprocessWikilinks(content: string): string {
  return content.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, target: string, label?: string) => {
      const text = (label ?? target).trim();
      const slug = target.trim().replace(/\.md$/i, "");
      const href = `/note/${slug.split("/").map(encodeURIComponent).join("/")}`;
      return `[${text}](${href})`;
    },
  );
}

function enhanceMediaEmbeds(html: string): string {
  const youtubeParagraph = new RegExp(
    String.raw`<p>\s*<a[^>]+href="(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})[^"]*)"[^>]*>[^<]*<\/a>\s*<\/p>`,
    "gi",
  );

  return html.replace(
    youtubeParagraph,
    (_match, _url: string, id: string) =>
      `<div class="silence-youtube"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>`,
  );
}

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const safeHref = href ?? "#";
      const isInternal = safeHref.startsWith("/");
      const externalAttrs = isInternal
        ? ""
        : ' target="_blank" rel="noopener noreferrer"';
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${safeHref}"${titleAttr}${externalAttrs}>${text}</a>`;
    },
  },
});

export function renderMarkdown(content: string): string {
  const preprocessed = preprocessWikilinks(content);
  const html = marked.parse(preprocessed, { async: false }) as string;
  return enhanceMediaEmbeds(html);
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(youtubeIdPattern);
  return match?.[1] ?? null;
}
