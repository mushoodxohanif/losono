import {
  checkTrackingRateLimitDb,
  isWithinRateLimitWindow,
  wouldExceedRateLimit,
} from "@/lib/db/queries/tracking-rate-limits";
import {
  TRACKING_RATE_LIMIT_MAX_EVENTS,
  TRACKING_RATE_LIMIT_WINDOW_MS,
} from "@/lib/tracking/config";

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const visitorEventCounts = new Map<string, RateLimitEntry>();

function getRateLimitKey(agentId: string, visitorId: string) {
  return `${agentId}:${visitorId}`;
}

function checkTrackingRateLimitMemory(
  agentId: string,
  visitorId: string,
  eventCount: number,
  now = Date.now(),
): boolean {
  const key = getRateLimitKey(agentId, visitorId);
  const existing = visitorEventCounts.get(key);
  const windowStartDate = new Date(now);

  if (
    !existing ||
    !isWithinRateLimitWindow(new Date(existing.windowStart), windowStartDate)
  ) {
    visitorEventCounts.set(key, { count: eventCount, windowStart: now });
    return eventCount <= TRACKING_RATE_LIMIT_MAX_EVENTS;
  }

  if (wouldExceedRateLimit(existing.count, eventCount)) {
    return false;
  }

  existing.count += eventCount;
  return true;
}

export async function checkTrackingRateLimit(
  agentId: string,
  visitorId: string,
  eventCount: number,
  now = new Date(),
): Promise<boolean> {
  try {
    return await checkTrackingRateLimitDb(agentId, visitorId, eventCount, now);
  } catch (error) {
    console.error(
      "Tracking rate limit DB check failed, using memory fallback:",
      error,
    );
    return checkTrackingRateLimitMemory(
      agentId,
      visitorId,
      eventCount,
      now.getTime(),
    );
  }
}

export {
  isWithinRateLimitWindow,
  wouldExceedRateLimit,
  TRACKING_RATE_LIMIT_MAX_EVENTS,
  TRACKING_RATE_LIMIT_WINDOW_MS,
};
