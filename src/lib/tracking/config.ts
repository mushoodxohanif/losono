import { listDistinctEventNamesForAgent } from "@/lib/db/queries/tracking-events";
import type { ExternalForm } from "@/lib/db/schema";

export const TRACKING_MAX_BATCH_SIZE = 20;
export const TRACKING_MAX_PROPERTIES_BYTES = 8 * 1024;
export const TRACKING_SESSION_INACTIVITY_MINUTES = 30;
export const TRACKING_RATE_LIMIT_WINDOW_MS = 60_000;
export const TRACKING_RATE_LIMIT_MAX_EVENTS = 100;

export type TrackingConfigPayload = {
  agentId: string;
  slug: string;
  sessionInactivityMinutes: number;
  maxBatchSize: number;
  maxPropertiesBytes: number;
  rateLimit: {
    windowMs: number;
    maxEventsPerVisitor: number;
  };
  forms: Array<{
    id: string;
    slug: string;
    name: string;
    fields: ExternalForm["fields"];
  }>;
  knownEventNames: string[];
};

export async function buildTrackingConfig(input: {
  agentId: string;
  slug: string;
  forms: ExternalForm[];
}): Promise<TrackingConfigPayload> {
  const knownEventNames = await listDistinctEventNamesForAgent(
    input.agentId,
    50,
  );

  return {
    agentId: input.agentId,
    slug: input.slug,
    sessionInactivityMinutes: TRACKING_SESSION_INACTIVITY_MINUTES,
    maxBatchSize: TRACKING_MAX_BATCH_SIZE,
    maxPropertiesBytes: TRACKING_MAX_PROPERTIES_BYTES,
    rateLimit: {
      windowMs: TRACKING_RATE_LIMIT_WINDOW_MS,
      maxEventsPerVisitor: TRACKING_RATE_LIMIT_MAX_EVENTS,
    },
    forms: input.forms.map((form) => ({
      id: form.id,
      slug: form.slug,
      name: form.name,
      fields: form.fields,
    })),
    knownEventNames,
  };
}
