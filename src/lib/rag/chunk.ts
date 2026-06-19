import { CHUNK_OVERLAP_CHARS, CHUNK_SIZE_CHARS } from "@/lib/rag/constants";

export type TextChunk = {
  content: string;
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
  };
};

export function chunkText(
  text: string,
  options?: {
    chunkSize?: number;
    overlap?: number;
  },
): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const chunkSize = options?.chunkSize ?? CHUNK_SIZE_CHARS;
  const overlap = options?.overlap ?? CHUNK_OVERLAP_CHARS;

  if (normalized.length <= chunkSize) {
    return [
      {
        content: normalized,
        metadata: {
          chunkIndex: 0,
          startChar: 0,
          endChar: normalized.length,
        },
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", end);
      const sentenceBreak = normalized.lastIndexOf(". ", end);
      const wordBreak = normalized.lastIndexOf(" ", end);
      const preferredBreak = Math.max(paragraphBreak, sentenceBreak, wordBreak);

      if (preferredBreak > start + chunkSize / 2) {
        end = preferredBreak + (sentenceBreak === preferredBreak ? 2 : 1);
      }
    }

    const content = normalized.slice(start, end).trim();
    if (content) {
      chunks.push({
        content,
        metadata: {
          chunkIndex,
          startChar: start,
          endChar: end,
        },
      });
      chunkIndex += 1;
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
