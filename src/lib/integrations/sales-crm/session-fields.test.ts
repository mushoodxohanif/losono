import { describe, expect, test } from "bun:test";
import type { TrackingSession } from "@/lib/db/schema";
import { transformSessionData } from "@/lib/integrations/sales-crm/session-fields";

describe("transformSessionData", () => {
  test("maps session virtual fields to CRM keys", () => {
    const session: TrackingSession = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      agentId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      visitorId: "visitor-123",
      startedAt: new Date("2026-06-30T11:00:00Z"),
      lastActivityAt: new Date("2026-06-30T11:30:00Z"),
      landingPage: "https://example.com/pricing",
      referrer: "https://google.com",
      eventCount: 2,
      summary: {
        lastEvent: {
          name: "document_open",
          at: "2026-06-30T11:30:00Z",
        },
        eventCounts: {
          document_open: 1,
          product_view: 1,
        },
      },
      createdAt: new Date("2026-06-30T11:00:00Z"),
    };

    const fieldValues = transformSessionData(
      session,
      [
        {
          eventName: "document_open",
          pageUrl: "https://example.com/brochure",
          createdAt: new Date("2026-06-30T11:30:00Z"),
        },
      ],
      {
        "session:visitor_id": "crm_visitor",
        "session:landing_page": "crm_landing",
        "session:event_count": "crm_events",
        "session:events_summary": "crm_summary",
        "session:last_event": "crm_last_event",
        "session:referrer": "crm_referrer",
      },
    );

    expect(fieldValues.crm_visitor).toBe("visitor-123");
    expect(fieldValues.crm_landing).toBe("https://example.com/pricing");
    expect(fieldValues.crm_events).toBe("2");
    expect(fieldValues.crm_referrer).toBe("https://google.com");
    expect(fieldValues.crm_last_event).toBe(
      "document_open (2026-06-30T11:30:00Z)",
    );
    expect(fieldValues.crm_summary).toContain("document_open");
  });
});
