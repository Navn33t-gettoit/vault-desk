"use client";

import { TEXT_SIZE_LABELS } from "@/lib/text-size";
import { useTextSize } from "@/components/TextSizeProvider";

export function TextSizeToggle() {
  const { textSize, toggleTextSize } = useTextSize();

  return (
    <button
      type="button"
      onClick={toggleTextSize}
      className="silence-chip transition-opacity hover:opacity-90"
      aria-label={`Text size: ${TEXT_SIZE_LABELS[textSize]}. Click to switch.`}
      title="Toggle text size"
    >
      Text: {TEXT_SIZE_LABELS[textSize]}
    </button>
  );
}
