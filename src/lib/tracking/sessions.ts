import { createTrackingEvent } from "@/lib/db/queries/tracking-events";
import {
  createTrackingSession,
  getOpenTrackingSession,
  updateTrackingSession,
} from "@/lib/db/queries/tracking-sessions";
import type { TrackingSessionSummary } from "@/lib/db/schema";

export type TrackingEventInput = {
  event: string;
  properties?: Record<string, unknown>;
  pageUrl?: string;
  timestamp?: string;
};

function parseEventTimestamp(timestamp: string | undefined, fallback: Date) {
  if (!timestamp) {
    return fallback;
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
}

function updateSummary(
  summary: TrackingSessionSummary,
  eventName: string,
  at: Date,
): TrackingSessionSummary {
  const eventCounts = { ...(summary.eventCounts ?? {}) };
  eventCounts[eventName] = (eventCounts[eventName] ?? 0) + 1;

  return {
    ...summary,
    lastEvent: { name: eventName, at: at.toISOString() },
    eventCounts,
  };
}

export async function ingestTrackingEvents(input: {
  agentId: string;
  visitorId: string;
  events: TrackingEventInput[];
  referrer?: string | null;
}) {
  let session = await getOpenTrackingSession(input.agentId, input.visitorId);
  const createdEvents = [];

  for (const eventInput of input.events) {
    const eventAt = parseEventTimestamp(eventInput.timestamp, new Date());

    if (!session) {
      session = await createTrackingSession({
        agentId: input.agentId,
        visitorId: input.visitorId,
        startedAt: eventAt,
        lastActivityAt: eventAt,
        landingPage: eventInput.pageUrl ?? null,
        referrer: input.referrer ?? null,
      });
    }

    const event = await createTrackingEvent({
      sessionId: session.id,
      agentId: input.agentId,
      visitorId: input.visitorId,
      eventName: eventInput.event,
      properties: eventInput.properties ?? null,
      pageUrl: eventInput.pageUrl ?? null,
      createdAt: eventAt,
    });

    const summary = updateSummary(
      session.summary ?? {},
      eventInput.event,
      eventAt,
    );
    const updatedSession = await updateTrackingSession(session.id, {
      lastActivityAt: eventAt,
      eventCount: session.eventCount + 1,
      summary,
    });

    if (!updatedSession) {
      throw new Error("Failed to update tracking session");
    }

    session = updatedSession;
    createdEvents.push(event);
  }

  return { session, events: createdEvents };
}
