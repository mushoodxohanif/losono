import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  type Conversation,
  type ConversationMode,
  conversations,
  type MessageRole,
  messages,
  usageEvents,
} from "@/lib/db/schema";

export async function getConversationForAgentUser(
  conversationId: string,
  agentId: string,
  userId: string,
): Promise<Conversation | null> {
  const [conversation] = await getDb()
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.agentId, agentId),
        eq(conversations.userId, userId),
      ),
    )
    .limit(1);

  return conversation ?? null;
}

export async function createConversation(input: {
  agentId: string;
  userId?: string;
  visitorId?: string;
  mode: ConversationMode;
}): Promise<Conversation> {
  const [conversation] = await getDb()
    .insert(conversations)
    .values({
      agentId: input.agentId,
      userId: input.userId,
      visitorId: input.visitorId,
      mode: input.mode,
    })
    .returning();

  if (!conversation) {
    throw new Error("Failed to create conversation");
  }

  return conversation;
}

export async function getOrCreatePlaygroundConversation(
  agentId: string,
  userId: string,
  conversationId?: string,
): Promise<Conversation> {
  if (conversationId) {
    const existing = await getConversationForAgentUser(
      conversationId,
      agentId,
      userId,
    );
    if (existing) {
      return existing;
    }
  }

  return createConversation({
    agentId,
    userId,
    mode: "playground",
  });
}

export async function insertMessage(input: {
  conversationId: string;
  role: MessageRole;
  content: string;
}) {
  const [message] = await getDb()
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
    })
    .returning();

  return message;
}

export async function recordChatUsage(agentId: string, quantity = 1) {
  await getDb().insert(usageEvents).values({
    agentId,
    eventType: "chat_message",
    quantity,
  });
}

export async function recordVoiceUsage(agentId: string, quantity = 1) {
  await getDb().insert(usageEvents).values({
    agentId,
    eventType: "voice_minute",
    quantity,
  });
}

export async function getOrCreateDeployedConversation(input: {
  agentId: string;
  mode: "chat" | "voice";
  conversationId?: string;
  visitorId?: string;
}): Promise<Conversation> {
  if (input.conversationId) {
    const [existing] = await getDb()
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, input.conversationId),
          eq(conversations.agentId, input.agentId),
          eq(conversations.mode, input.mode),
        ),
      )
      .limit(1);

    if (existing) {
      return existing;
    }
  }

  const [conversation] = await getDb()
    .insert(conversations)
    .values({
      agentId: input.agentId,
      mode: input.mode,
      visitorId: input.visitorId,
    })
    .returning();

  if (!conversation) {
    throw new Error("Failed to create conversation");
  }

  return conversation;
}
