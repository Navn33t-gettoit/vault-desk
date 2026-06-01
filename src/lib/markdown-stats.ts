export type MarkdownStats = {
  wordCount: number;
  readMinutes: number;
};

export const READING_WPM = 200;

const EMPTY_STATS: MarkdownStats = { wordCount: 0, readMinutes: 0 };

/** Strip common Markdown syntax to approximate plain-text word count. */
export function stripMarkdownSyntax(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) =>
      (label ?? target).trim(),
    )
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/(\*\*|__|\*|_|~~)/g, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\|/g, " ")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(markdown: string): number {
  const plain = stripMarkdownSyntax(markdown);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function estimateReadMinutes(
  wordCount: number,
  wordsPerMinute = READING_WPM,
): number {
  if (wordCount === 0) return 0;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function computeMarkdownStats(markdown: string): MarkdownStats {
  const wordCount = countWords(markdown);
  return {
    wordCount,
    readMinutes: estimateReadMinutes(wordCount),
  };
}

export function formatMarkdownStats(stats: MarkdownStats): string {
  if (stats.wordCount === 0) {
    return "0 words · 0 min read";
  }

  const wordLabel = stats.wordCount === 1 ? "word" : "words";
  const minuteLabel = stats.readMinutes === 1 ? "min" : "min";
  return `${stats.wordCount} ${wordLabel} · ${stats.readMinutes} ${minuteLabel} read`;
}

export function emptyMarkdownStats(): MarkdownStats {
  return { ...EMPTY_STATS };
}
