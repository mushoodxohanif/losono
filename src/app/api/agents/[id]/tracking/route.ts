import { auth } from "@/auth";
import { getAgentForUser } from "@/lib/db/queries/agents";
import {
  listTrackingEventsForAgent,
  listTrackingEventsForSession,
} from "@/lib/db/queries/tracking-events";
import {
  getTrackingSessionById,
  listTrackingSessionsForAgent,
} from "@/lib/db/queries/tracking-sessions";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const agent = await getAgentForUser(agentId, userId);
  if (!agent) {
    return Response.json({ error: "agent_not_found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (sessionId) {
    const trackingSession = await getTrackingSessionById(agentId, sessionId);

    if (!trackingSession) {
      return Response.json({ error: "session_not_found" }, { status: 404 });
    }

    const events = await listTrackingEventsForSession(sessionId);
    return Response.json({ events });
  }

  const eventLimit = Number.parseInt(
    url.searchParams.get("limit") ?? "200",
    10,
  );
  const [sessions, events] = await Promise.all([
    listTrackingSessionsForAgent(agentId),
    listTrackingEventsForAgent(agentId, {
      limit: Number.isFinite(eventLimit) ? eventLimit : 200,
    }),
  ]);

  return Response.json({ sessions, events });
}
