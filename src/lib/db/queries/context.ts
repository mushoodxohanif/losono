import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getAgentForUser } from "@/lib/db/queries/agents";
import type { Subscription } from "@/lib/db/schema";
import {
  type ContextSource,
  contextSources,
  documentChunks,
} from "@/lib/db/schema";
import { FREE_CONTEXT_FILE_LIMIT } from "@/lib/rag/constants";

export { getAgentForUser };

export function getContextFileLimit(
  subscription: Subscription | null,
): number | null {
  if (!subscription || subscription.plan === "pro") {
    return null;
  }

  return FREE_CONTEXT_FILE_LIMIT;
}

export async function countContextSources(agentId: string): Promise<number> {
  const [result] = await getDb()
    .select({ count: count() })
    .from(contextSources)
    .where(eq(contextSources.agentId, agentId));

  return Number(result?.count ?? 0);
}

export async function listContextSources(
  agentId: string,
): Promise<ContextSource[]> {
  return getDb()
    .select()
    .from(contextSources)
    .where(eq(contextSources.agentId, agentId))
    .orderBy(desc(contextSources.createdAt));
}

export async function getContextSourceForAgent(
  agentId: string,
  sourceId: string,
): Promise<ContextSource | null> {
  const [source] = await getDb()
    .select()
    .from(contextSources)
    .where(
      and(eq(contextSources.id, sourceId), eq(contextSources.agentId, agentId)),
    )
    .limit(1);

  return source ?? null;
}

export async function deleteContextSource(
  agentId: string,
  sourceId: string,
): Promise<boolean> {
  const deleted = await getDb()
    .delete(contextSources)
    .where(
      and(eq(contextSources.id, sourceId), eq(contextSources.agentId, agentId)),
    )
    .returning({ id: contextSources.id });

  return deleted.length > 0;
}

export async function insertContextSourceWithChunks(input: {
  agentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  chunks: Array<{
    content: string;
    metadata: Record<string, unknown>;
    embedding: number[];
  }>;
}): Promise<ContextSource> {
  const db = getDb();

  const [source] = await db
    .insert(contextSources)
    .values({
      agentId: input.agentId,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      chunkCount: input.chunks.length,
    })
    .returning();

  if (!source) {
    throw new Error("Failed to create context source");
  }

  try {
    if (input.chunks.length > 0) {
      await db.insert(documentChunks).values(
        input.chunks.map((chunk) => ({
          agentId: input.agentId,
          documentId: source.id,
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: chunk.embedding,
        })),
      );
    }
  } catch (error) {
    await db.delete(contextSources).where(eq(contextSources.id, source.id));
    throw error;
  }

  return source;
}
