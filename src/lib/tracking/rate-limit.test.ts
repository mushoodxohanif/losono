import { describe, expect, test } from "bun:test";
import {
  isWithinRateLimitWindow,
  wouldExceedRateLimit,
} from "@/lib/db/queries/tracking-rate-limits";
import {
  TRACKING_RATE_LIMIT_MAX_EVENTS,
  TRACKING_RATE_LIMIT_WINDOW_MS,
} from "@/lib/tracking/config";

describe("tracking rate limit helpers", () => {
  test("isWithinRateLimitWindow returns true inside the window", () => {
    const now = new Date("2026-06-30T12:00:00Z");
    const windowStart = new Date(now.getTime() - 30_000);

    expect(
      isWithinRateLimitWindow(windowStart, now, TRACKING_RATE_LIMIT_WINDOW_MS),
    ).toBe(true);
  });

  test("isWithinRateLimitWindow returns false after the window expires", () => {
    const now = new Date("2026-06-30T12:00:00Z");
    const windowStart = new Date(
      now.getTime() - TRACKING_RATE_LIMIT_WINDOW_MS - 1,
    );

    expect(
      isWithinRateLimitWindow(windowStart, now, TRACKING_RATE_LIMIT_WINDOW_MS),
    ).toBe(false);
  });

  test("wouldExceedRateLimit respects the max event cap", () => {
    expect(
      wouldExceedRateLimit(
        TRACKING_RATE_LIMIT_MAX_EVENTS - 1,
        1,
        TRACKING_RATE_LIMIT_MAX_EVENTS,
      ),
    ).toBe(false);

    expect(
      wouldExceedRateLimit(
        TRACKING_RATE_LIMIT_MAX_EVENTS,
        1,
        TRACKING_RATE_LIMIT_MAX_EVENTS,
      ),
    ).toBe(true);
  });
});
