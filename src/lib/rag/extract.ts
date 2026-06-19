import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { chunkText, type TextChunk } from "@/lib/rag/chunk";
import { getIngestStrategy, type IngestStrategy } from "@/lib/rag/mime";

export type PreparedChunk = {
  content: string;
  metadata: Record<string, unknown>;
  /** Base64-encoded bytes for multimodal embedding, when applicable. */
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

export type PreparedIngest = {
  strategy: IngestStrategy;
  chunks: PreparedChunk[];
};

function toBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}

function textChunksToPrepared(chunks: TextChunk[]): PreparedChunk[] {
  return chunks.map((chunk) => ({
    content: chunk.content,
    metadata: chunk.metadata,
  }));
}

export async function prepareIngestChunks(input: {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}): Promise<PreparedIngest> {
  const strategy = getIngestStrategy(input.mimeType);

  if (strategy === "multimodal") {
    return {
      strategy,
      chunks: [
        {
          content: input.filename,
          metadata: {
            chunkIndex: 0,
            filename: input.filename,
            mimeType: input.mimeType,
          },
          inlineData: {
            mimeType: input.mimeType,
            data: toBase64(input.buffer),
          },
        },
      ],
    };
  }

  if (strategy === "docx") {
    const text = await extractDocxText(input.buffer);
    return {
      strategy,
      chunks: textChunksToPrepared(chunkText(text)),
    };
  }

  if (strategy === "pdf") {
    const text = await extractPdfText(input.buffer);

    if (text) {
      return {
        strategy,
        chunks: textChunksToPrepared(chunkText(text)),
      };
    }

    // Scanned PDFs may have no extractable text — fall back to multimodal embed.
    return {
      strategy: "multimodal",
      chunks: [
        {
          content: input.filename,
          metadata: {
            chunkIndex: 0,
            filename: input.filename,
            mimeType: input.mimeType,
            fallback: "multimodal_pdf",
          },
          inlineData: {
            mimeType: input.mimeType,
            data: toBase64(input.buffer),
          },
        },
      ],
    };
  }

  const text = input.buffer.toString("utf-8").trim();
  return {
    strategy: "text",
    chunks: textChunksToPrepared(chunkText(text)),
  };
}
