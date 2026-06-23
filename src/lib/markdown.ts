import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

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

      // Block javascript: and data: URIs
      const lc = safeHref.trim().toLowerCase();
      if (lc.startsWith("javascript:") || lc.startsWith("data:")) {
        return `<span>${text}</span>`;
      }

      const isInternal = safeHref.startsWith("/");
      const externalAttrs = isInternal
        ? ""
        : ' target="_blank" rel="noopener noreferrer"';
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${safeHref}"${titleAttr}${externalAttrs}>${text}</a>`;
    },
  },
});

// Allow iframes for YouTube embeds, but strip everything else dangerous
DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "iframe") {
    const src = (node as HTMLIFrameElement).getAttribute("src") ?? "";
    if (!src.startsWith("https://www.youtube.com/embed/")) {
      node.parentNode?.removeChild(node);
    }
  }
});

export function renderMarkdown(content: string): string {
  const preprocessed = preprocessWikilinks(content);
  const html = marked.parse(preprocessed, { async: false }) as string;
  const withEmbeds = enhanceMediaEmbeds(html);
  return DOMPurify.sanitize(withEmbeds, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "referrerpolicy",
      "loading",
    ],
  });
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(youtubeIdPattern);
  return match?.[1] ?? null;
}
