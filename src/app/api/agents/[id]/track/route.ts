import { resolveDeployedAccess } from "@/lib/auth/deploy-access";
import { getPublishedAgentById } from "@/lib/db/queries/agents";
import {
  TRACKING_MAX_BATCH_SIZE,
  TRACKING_MAX_PROPERTIES_BYTES,
} from "@/lib/tracking/config";
import {
  deployedCorsPreflightResponse,
  withDeployedCors,
} from "@/lib/tracking/cors";
import { checkTrackingRateLimit } from "@/lib/tracking/rate-limit";
import {
  ingestTrackingEvents,
  type TrackingEventInput,
} from "@/lib/tracking/sessions";

type RouteParams = { params: Promise<{ id: string }> };

const MAX_BATCH_SIZE = TRACKING_MAX_BATCH_SIZE;
const MAX_PROPERTIES_BYTES = TRACKING_MAX_PROPERTIES_BYTES;

type TrackEventPayload = {
  event?: string;
  properties?: Record<string, unknown>;
  pageUrl?: string;
  timestamp?: string;
};

type TrackRequestBody = TrackEventPayload & {
  visitorId?: string;
  events?: TrackEventPayload[];
  referrer?: string;
};

function getPropertiesByteSize(
  properties: Record<string, unknown> | undefined,
) {
  if (!properties) {
    return 0;
  }

  return new TextEncoder().encode(JSON.stringify(properties)).length;
}

function normalizeEventPayload(
  payload: TrackEventPayload,
): TrackingEventInput | null {
  const event = payload.event?.trim();
  if (!event) {
    return null;
  }

  if (getPropertiesByteSize(payload.properties) > MAX_PROPERTIES_BYTES) {
    return null;
  }

  return {
    event,
    properties: payload.properties,
    pageUrl: payload.pageUrl?.trim() || undefined,
    timestamp: payload.timestamp,
  };
}

function parseTrackEvents(
  body: TrackRequestBody,
): TrackingEventInput[] | "invalid" {
  if (Array.isArray(body.events)) {
    if (body.events.length === 0 || body.events.length > MAX_BATCH_SIZE) {
      return "invalid";
    }

    const events: TrackingEventInput[] = [];
    for (const payload of body.events) {
      const normalized = normalizeEventPayload(payload);
      if (!normalized) {
        return "invalid";
      }
      events.push(normalized);
    }

    return events;
  }

  const normalized = normalizeEventPayload(body);
  if (!normalized) {
    return "invalid";
  }

  return [normalized];
}

export async function OPTIONS(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const agent = await getPublishedAgentById(agentId);

  if (!agent) {
    return Response.json({ error: "agent_not_published" }, { status: 403 });
  }

  return deployedCorsPreflightResponse(request.headers.get("origin"), agent);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const origin = request.headers.get("origin");

  let body: TrackRequestBody;
  try {
    body = (await request.json()) as TrackRequestBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const visitorId = body.visitorId?.trim();
  if (!visitorId) {
    return Response.json({ error: "visitor_id_required" }, { status: 400 });
  }

  const access = await resolveDeployedAccess({
    agentId,
    request,
    visitorId,
  });

  if (access instanceof Response) {
    return access;
  }

  const events = parseTrackEvents(body);
  if (events === "invalid") {
    return withDeployedCors(
      Response.json({ error: "validation_failed" }, { status: 400 }),
      origin,
      access.agent,
    );
  }

  if (!(await checkTrackingRateLimit(agentId, visitorId, events.length))) {
    return withDeployedCors(
      Response.json({ error: "rate_limited" }, { status: 429 }),
      origin,
      access.agent,
    );
  }

  const { session, events: createdEvents } = await ingestTrackingEvents({
    agentId,
    visitorId,
    events,
    referrer: body.referrer?.trim() || null,
  });

  return withDeployedCors(
    Response.json({
      sessionId: session.id,
      eventIds: createdEvents.map((event) => event.id),
      eventCount: session.eventCount,
    }),
    origin,
    access.agent,
  );
}
