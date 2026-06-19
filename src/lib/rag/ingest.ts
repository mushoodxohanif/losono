import { insertContextSourceWithChunks } from "@/lib/db/queries/context";
import type { ContextSource } from "@/lib/db/schema";
import { embedChunks } from "@/lib/gemini/embeddings";
import { prepareIngestChunks } from "@/lib/rag/extract";
import { isAllowedMimeType } from "@/lib/rag/mime";

export class ContextIngestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ContextIngestError";
  }
}

export type IngestContextInput = {
  agentId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

export type IngestContextResult = {
  source: ContextSource;
  chunkCount: number;
};

export async function ingestContextFile(
  input: IngestContextInput,
): Promise<IngestContextResult> {
  if (input.buffer.length === 0) {
    throw new ContextIngestError(
      "Uploaded file is empty",
      "context_file_empty",
      400,
    );
  }

  if (!isAllowedMimeType(input.mimeType)) {
    throw new ContextIngestError(
      "Unsupported file type",
      "context_file_type_not_allowed",
      415,
      { mimeType: input.mimeType },
    );
  }

  const prepared = await prepareIngestChunks({
    buffer: input.buffer,
    mimeType: input.mimeType,
    filename: input.filename,
  });

  if (prepared.chunks.length === 0) {
    throw new ContextIngestError(
      "No extractable content found in file",
      "context_file_no_content",
      422,
    );
  }

  const embeddings = await embedChunks(prepared.chunks);

  if (embeddings.length !== prepared.chunks.length) {
    throw new ContextIngestError(
      "Embedding count mismatch",
      "embedding_failed",
      500,
    );
  }

  const source = await insertContextSourceWithChunks({
    agentId: input.agentId,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.buffer.length,
    chunks: prepared.chunks.map((chunk, index) => ({
      content: chunk.content,
      metadata: {
        ...chunk.metadata,
        strategy: prepared.strategy,
      },
      embedding: embeddings[index] ?? [],
    })),
  });

  return {
    source,
    chunkCount: prepared.chunks.length,
  };
}
