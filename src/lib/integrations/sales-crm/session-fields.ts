import type {
  CrmFieldMapping,
  TrackingSession,
  TrackingSessionSummary,
} from "@/lib/db/schema";
import { findCompatibleCrmField } from "@/lib/integrations/sales-crm/crm-field-match";
import type { SalesCrmField } from "@/lib/integrations/sales-crm/types";
import type { PreChatField } from "@/lib/pre-chat-form";

export const SESSION_CRM_FIELD_KEYS = [
  "visitor_id",
  "landing_page",
  "event_count",
  "events_summary",
  "last_event",
  "referrer",
] as const;

export type SessionCrmFieldKey = (typeof SESSION_CRM_FIELD_KEYS)[number];

const SESSION_FIELD_LABELS: Record<SessionCrmFieldKey, string> = {
  visitor_id: "Visitor ID",
  landing_page: "Landing page",
  event_count: "Event count",
  events_summary: "Events summary",
  last_event: "Last event",
  referrer: "Referrer",
};

export function sessionFieldKey(key: SessionCrmFieldKey): string {
  return `session:${key}`;
}

export function suggestSessionMapping(
  crmFields: SalesCrmField[],
): CrmFieldMapping {
  const mapping: CrmFieldMapping = {};
  const usedKeys = new Set<string>();

  for (const key of SESSION_CRM_FIELD_KEYS) {
    const pseudoField: PreChatField = {
      id: key,
      label: SESSION_FIELD_LABELS[key],
      type:
        key === "event_count"
          ? "text"
          : key === "events_summary" || key === "last_event"
            ? "textarea"
            : "text",
      required: false,
    };

    const match = findCompatibleCrmField(pseudoField, crmFields, usedKeys);

    if (match) {
      mapping[sessionFieldKey(key)] = match.key;
      usedKeys.add(match.key);
    }
  }

  return mapping;
}

export function isSessionMappingReady(mapping: CrmFieldMapping): boolean {
  return SESSION_CRM_FIELD_KEYS.some((key) =>
    Boolean(mapping[sessionFieldKey(key)]?.trim()),
  );
}

function formatEventCounts(summary: TrackingSessionSummary | null): string {
  const counts = summary?.eventCounts;
  if (!counts || Object.keys(counts).length === 0) {
    return "";
  }

  return Object.entries(counts)
    .sort(([, left], [, right]) => right - left)
    .map(([name, count]) => `${name} (${count})`)
    .join(", ");
}

function formatEventsSummary(
  summary: TrackingSessionSummary | null,
  events: Array<{ eventName: string; pageUrl: string | null; createdAt: Date }>,
): string {
  const countsText = formatEventCounts(summary);
  const lines: string[] = [];

  if (countsText) {
    lines.push(`Top events: ${countsText}`);
  }

  if (events.length > 0) {
    lines.push("Recent events:");
    for (const event of events.slice(0, 20)) {
      const page = event.pageUrl ? ` · ${event.pageUrl}` : "";
      lines.push(
        `- ${event.createdAt.toISOString()} · ${event.eventName}${page}`,
      );
    }

    if (events.length > 20) {
      lines.push(`… and ${events.length - 20} more`);
    }
  }

  return lines.join("\n");
}

function formatLastEvent(summary: TrackingSessionSummary | null): string {
  if (!summary?.lastEvent) {
    return "";
  }

  return `${summary.lastEvent.name} (${summary.lastEvent.at})`;
}

function buildSessionFieldValues(
  session: TrackingSession,
  events: Array<{ eventName: string; pageUrl: string | null; createdAt: Date }>,
): Record<SessionCrmFieldKey, string> {
  return {
    visitor_id: session.visitorId,
    landing_page: session.landingPage ?? "",
    event_count: String(session.eventCount),
    events_summary: formatEventsSummary(session.summary, events),
    last_event: formatLastEvent(session.summary),
    referrer: session.referrer ?? "",
  };
}

export function transformSessionData(
  session: TrackingSession,
  events: Array<{ eventName: string; pageUrl: string | null; createdAt: Date }>,
  mapping: CrmFieldMapping,
): Record<string, string> {
  const values = buildSessionFieldValues(session, events);
  const fieldValues: Record<string, string> = {};

  for (const key of SESSION_CRM_FIELD_KEYS) {
    const crmKey = mapping[sessionFieldKey(key)];
    if (!crmKey?.trim()) {
      continue;
    }

    const value = values[key];
    if (value) {
      fieldValues[crmKey] = value;
    }
  }

  return fieldValues;
}
