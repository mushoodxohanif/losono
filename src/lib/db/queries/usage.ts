import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  contextSources,
  conversations,
  messages,
  usageEvents,
} from "@/lib/db/schema";

export type AgentUsageSummary = {
  chatMessages: number;
  voiceMinutes: number;
  contextFiles: number;
  conversations: number;
  last30Days: {
    chatMessages: number;
    voiceMinutes: number;
  };
};

export async function getAgentUsageSummary(
  agentId: string,
): Promise<AgentUsageSummary> {
  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [usageTotals] = await db
    .select({
      chatMessages: sum(
        sql`CASE WHEN ${usageEvents.eventType} = 'chat_message' THEN ${usageEvents.quantity} ELSE 0 END`,
      ),
      voiceMinutes: sum(
        sql`CASE WHEN ${usageEvents.eventType} = 'voice_minute' THEN ${usageEvents.quantity} ELSE 0 END`,
      ),
    })
    .from(usageEvents)
    .where(eq(usageEvents.agentId, agentId));

  const [recentUsage] = await db
    .select({
      chatMessages: sum(
        sql`CASE WHEN ${usageEvents.eventType} = 'chat_message' THEN ${usageEvents.quantity} ELSE 0 END`,
      ),
      voiceMinutes: sum(
        sql`CASE WHEN ${usageEvents.eventType} = 'voice_minute' THEN ${usageEvents.quantity} ELSE 0 END`,
      ),
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.agentId, agentId),
        gte(usageEvents.createdAt, thirtyDaysAgo),
      ),
    );

  const [contextCount] = await db
    .select({ count: count() })
    .from(contextSources)
    .where(eq(contextSources.agentId, agentId));

  const [conversationCount] = await db
    .select({ count: count() })
    .from(conversations)
    .where(
      and(
        eq(conversations.agentId, agentId),
        sql`${conversations.mode} != 'playground'`,
      ),
    );

  return {
    chatMessages: Number(usageTotals?.chatMessages ?? 0),
    voiceMinutes: Number(usageTotals?.voiceMinutes ?? 0),
    contextFiles: Number(contextCount?.count ?? 0),
    conversations: Number(conversationCount?.count ?? 0),
    last30Days: {
      chatMessages: Number(recentUsage?.chatMessages ?? 0),
      voiceMinutes: Number(recentUsage?.voiceMinutes ?? 0),
    },
  };
}

export async function listConversationLogs(input: {
  agentId: string;
  limit?: number;
}) {
  const limit = input.limit ?? 50;
  const db = getDb();

  const rows = await db
    .select({
      id: conversations.id,
      mode: conversations.mode,
      visitorId: conversations.visitorId,
      userId: conversations.userId,
      createdAt: conversations.createdAt,
      messageCount: count(messages.id),
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.agentId, input.agentId),
        sql`${conversations.mode} != 'playground'`,
      ),
    )
    .groupBy(conversations.id)
    .orderBy(sql`${conversations.createdAt} DESC`)
    .limit(limit);

  return rows;
}

export async function getConversationWithMessages(input: {
  agentId: string;
  conversationId: string;
}) {
  const db = getDb();

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, input.conversationId),
        eq(conversations.agentId, input.agentId),
        sql`${conversations.mode} != 'playground'`,
      ),
    )
    .limit(1);

  if (!conversation) {
    return null;
  }

  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(messages.createdAt);

  return { conversation, messages: conversationMessages };
}
