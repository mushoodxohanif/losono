import { and, desc, eq, isNull } from "drizzle-orm";
import { generateApiKey, hashApiKey } from "@/lib/api-keys";
import { getDb } from "@/lib/db";
import { type ApiKey, apiKeys } from "@/lib/db/schema";

export async function listApiKeysForAgent(agentId: string): Promise<ApiKey[]> {
  return getDb()
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.agentId, agentId), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(input: {
  agentId: string;
  name: string;
}): Promise<{ apiKey: ApiKey; rawKey: string; displayPrefix: string }> {
  const { rawKey, displayPrefix } = generateApiKey();
  const keyHash = await hashApiKey(rawKey);

  const [apiKey] = await getDb()
    .insert(apiKeys)
    .values({
      agentId: input.agentId,
      name: input.name,
      keyHash,
    })
    .returning();

  if (!apiKey) {
    throw new Error("Failed to create API key");
  }

  return { apiKey, rawKey, displayPrefix };
}

export async function revokeApiKey(
  agentId: string,
  keyId: string,
): Promise<boolean> {
  const revoked = await getDb()
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.agentId, agentId),
        isNull(apiKeys.revokedAt),
      ),
    )
    .returning({ id: apiKeys.id });

  return revoked.length > 0;
}

export async function findActiveApiKeyForAgent(
  agentId: string,
  rawKey: string,
  verify: (raw: string, hash: string) => Promise<boolean>,
): Promise<ApiKey | null> {
  const keys = await getDb()
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.agentId, agentId), isNull(apiKeys.revokedAt)));

  for (const key of keys) {
    if (await verify(rawKey, key.keyHash)) {
      return key;
    }
  }

  return null;
}

export async function touchApiKeyLastUsed(keyId: string) {
  await getDb()
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}
