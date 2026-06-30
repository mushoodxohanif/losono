import { auth } from "@/auth";
import { resolveDeployedAccess } from "@/lib/auth/deploy-access";
import {
  getAgentForUser,
  getPublishedAgentById,
} from "@/lib/db/queries/agents";
import { listExternalFormsForAgent } from "@/lib/db/queries/external-forms";
import { buildTrackingConfig } from "@/lib/tracking/config";
import {
  deployedCorsPreflightResponse,
  withDeployedCors,
} from "@/lib/tracking/cors";

type RouteParams = { params: Promise<{ id: string }> };

async function loadTrackingConfig(agentId: string, slug: string) {
  const forms = await listExternalFormsForAgent(agentId);
  return buildTrackingConfig({ agentId, slug, forms });
}

export async function OPTIONS(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const agent = await getPublishedAgentById(agentId);

  if (!agent) {
    return Response.json({ error: "agent_not_published" }, { status: 403 });
  }

  return deployedCorsPreflightResponse(request.headers.get("origin"), agent);
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const visitorId = url.searchParams.get("visitorId") ?? undefined;

  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const ownedAgent = await getAgentForUser(agentId, userId);
    if (ownedAgent) {
      const config = await loadTrackingConfig(ownedAgent.id, ownedAgent.slug);
      return Response.json(config);
    }
  }

  const access = await resolveDeployedAccess({
    agentId,
    request,
    visitorId,
  });

  if (access instanceof Response) {
    return access;
  }

  const config = await loadTrackingConfig(access.agent.id, access.agent.slug);

  return withDeployedCors(Response.json(config), origin, access.agent);
}
