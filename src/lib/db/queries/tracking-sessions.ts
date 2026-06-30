import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { type TrackingSessionSummary, trackingSessions } from "@/lib/db/schema";

const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

export function getSessionInactivityCutoff(now = new Date()) {
  return new Date(now.getTime() - SESSION_INACTIVITY_MS);
}

export async function getOpenTrackingSession(
  agentId: string,
  visitorId: string,
  now = new Date(),
) {
  const cutoff = getSessionInactivityCutoff(now);

  const [session] = await getDb()
    .select()
    .from(trackingSessions)
    .where(
      and(
        eq(trackingSessions.agentId, agentId),
        eq(trackingSessions.visitorId, visitorId),
        gte(trackingSessions.lastActivityAt, cutoff),
      ),
    )
    .orderBy(desc(trackingSessions.lastActivityAt))
    .limit(1);

  return session ?? null;
}

export async function createTrackingSession(input: {
  agentId: string;
  visitorId: string;
  startedAt: Date;
  lastActivityAt: Date;
  landingPage?: string | null;
  referrer?: string | null;
}) {
  const [session] = await getDb()
    .insert(trackingSessions)
    .values({
      agentId: input.agentId,
      visitorId: input.visitorId,
      startedAt: input.startedAt,
      lastActivityAt: input.lastActivityAt,
      landingPage: input.landingPage ?? null,
      referrer: input.referrer ?? null,
      eventCount: 0,
      summary: {},
    })
    .returning();

  return session;
}

export async function updateTrackingSession(
  sessionId: string,
  input: {
    lastActivityAt: Date;
    eventCount: number;
    summary: TrackingSessionSummary;
  },
) {
  const [session] = await getDb()
    .update(trackingSessions)
    .set({
      lastActivityAt: input.lastActivityAt,
      eventCount: input.eventCount,
      summary: input.summary,
    })
    .where(eq(trackingSessions.id, sessionId))
    .returning();

  return session ?? null;
}

export async function listTrackingSessionsForAgent(agentId: string) {
  return getDb()
    .select()
    .from(trackingSessions)
    .where(eq(trackingSessions.agentId, agentId))
    .orderBy(desc(trackingSessions.lastActivityAt));
}

export async function getTrackingSessionById(
  agentId: string,
  sessionId: string,
) {
  const [session] = await getDb()
    .select()
    .from(trackingSessions)
    .where(
      and(
        eq(trackingSessions.agentId, agentId),
        eq(trackingSessions.id, sessionId),
      ),
    )
    .limit(1);

  return session ?? null;
}
