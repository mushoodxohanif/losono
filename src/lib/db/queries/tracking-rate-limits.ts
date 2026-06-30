import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { trackingRateLimits } from "@/lib/db/schema";
import {
  TRACKING_RATE_LIMIT_MAX_EVENTS,
  TRACKING_RATE_LIMIT_WINDOW_MS,
} from "@/lib/tracking/config";

export function isWithinRateLimitWindow(
  windowStart: Date,
  now: Date,
  windowMs = TRACKING_RATE_LIMIT_WINDOW_MS,
): boolean {
  return now.getTime() - windowStart.getTime() < windowMs;
}

export function wouldExceedRateLimit(
  currentCount: number,
  incomingCount: number,
  maxEvents = TRACKING_RATE_LIMIT_MAX_EVENTS,
): boolean {
  return currentCount + incomingCount > maxEvents;
}

export async function checkTrackingRateLimitDb(
  agentId: string,
  visitorId: string,
  eventCount: number,
  now = new Date(),
): Promise<boolean> {
  if (eventCount > TRACKING_RATE_LIMIT_MAX_EVENTS) {
    return false;
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(trackingRateLimits)
    .where(
      and(
        eq(trackingRateLimits.agentId, agentId),
        eq(trackingRateLimits.visitorId, visitorId),
      ),
    )
    .limit(1);

  const row = existing[0];

  if (!row || !isWithinRateLimitWindow(row.windowStart, now)) {
    await db
      .insert(trackingRateLimits)
      .values({
        agentId,
        visitorId,
        windowStart: now,
        eventCount,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [trackingRateLimits.agentId, trackingRateLimits.visitorId],
        set: {
          windowStart: now,
          eventCount,
          updatedAt: now,
        },
      });

    return true;
  }

  if (wouldExceedRateLimit(row.eventCount, eventCount)) {
    return false;
  }

  await db
    .update(trackingRateLimits)
    .set({
      eventCount: row.eventCount + eventCount,
      updatedAt: now,
    })
    .where(
      and(
        eq(trackingRateLimits.agentId, agentId),
        eq(trackingRateLimits.visitorId, visitorId),
      ),
    );

  return true;
}

export async function pruneStaleTrackingRateLimits(
  now = new Date(),
  windowMs = TRACKING_RATE_LIMIT_WINDOW_MS,
) {
  const cutoff = new Date(now.getTime() - windowMs * 2);

  await getDb()
    .delete(trackingRateLimits)
    .where(lt(trackingRateLimits.updatedAt, cutoff));
}
