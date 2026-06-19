import { env } from "@/lib/env";

/** Roughly 500 tokens at ~4 chars per token. */
export const CHUNK_SIZE_CHARS = 2_000;

/** Roughly 50 tokens overlap between consecutive chunks. */
export const CHUNK_OVERLAP_CHARS = 200;

export const MAX_CONTEXT_FILE_BYTES = env.MAX_CONTEXT_FILE_BYTES;

export const FREE_CONTEXT_FILE_LIMIT = env.FREE_CONTEXT_FILE_LIMIT;

export const EMBED_DIMENSIONS = env.GEMINI_EMBED_DIMENSIONS;

export const RETRIEVAL_TOP_K = 8;
