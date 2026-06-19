import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { embedQuery } from "@/lib/gemini/embeddings";
import { RETRIEVAL_TOP_K } from "@/lib/rag/constants";

export type RetrievedChunk = {
  id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
};

function formatVector(values: number[]): string {
  return `[${values.join(",")}]`;
}

export async function retrieveRelevantChunks(
  agentId: string,
  query: string,
  limit = RETRIEVAL_TOP_K,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(query);
  const queryVector = formatVector(queryEmbedding);

  const vectorLiteral = sql.raw(`'${queryVector}'::vector`);

  const rows = await getDb().execute<{
    id: string;
    content: string;
    metadata: Record<string, unknown> | null;
    similarity: number;
  }>(sql`
    SELECT
      id,
      content,
      metadata,
      1 - (embedding <=> ${vectorLiteral}) AS similarity
    FROM document_chunks
    WHERE agent_id = ${agentId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorLiteral}
    LIMIT ${limit}
  `);

  return rows.rows.map((row) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata,
    similarity: Number(row.similarity),
  }));
}
