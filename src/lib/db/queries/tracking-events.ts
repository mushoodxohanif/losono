import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { trackingEvents } from "@/lib/db/schema";

export async function createTrackingEvent(input: {
  sessionId: string;
  agentId: string;
  visitorId: string;
  eventName: string;
  properties?: Record<string, unknown> | null;
  pageUrl?: string | null;
  createdAt?: Date;
}) {
  const [event] = await getDb()
    .insert(trackingEvents)
    .values({
      sessionId: input.sessionId,
      agentId: input.agentId,
      visitorId: input.visitorId,
      eventName: input.eventName,
      properties: input.properties ?? null,
      pageUrl: input.pageUrl ?? null,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    })
    .returning();

  return event;
}

export async function listTrackingEventsForSession(sessionId: string) {
  return getDb()
    .select()
    .from(trackingEvents)
    .where(eq(trackingEvents.sessionId, sessionId))
    .orderBy(desc(trackingEvents.createdAt));
}

export async function listTrackingEventsForAgent(
  agentId: string,
  options?: { sessionId?: string; eventName?: string; limit?: number },
) {
  const conditions = [eq(trackingEvents.agentId, agentId)];

  if (options?.sessionId) {
    conditions.push(eq(trackingEvents.sessionId, options.sessionId));
  }

  if (options?.eventName) {
    conditions.push(eq(trackingEvents.eventName, options.eventName));
  }

  const query = getDb()
    .select()
    .from(trackingEvents)
    .where(and(...conditions))
    .orderBy(desc(trackingEvents.createdAt));

  if (options?.limit) {
    return query.limit(options.limit);
  }

  return query;
}

export async function listDistinctEventNamesForAgent(
  agentId: string,
  limit = 50,
) {
  const rows = await getDb()
    .select({ eventName: trackingEvents.eventName })
    .from(trackingEvents)
    .where(eq(trackingEvents.agentId, agentId))
    .groupBy(trackingEvents.eventName)
    .orderBy(desc(trackingEvents.eventName))
    .limit(limit);

  return rows.map((row) => row.eventName);
}
