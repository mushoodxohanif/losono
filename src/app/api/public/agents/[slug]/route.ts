import { getPublishedAgentBySlug } from "@/lib/db/queries/agents";
import { listExternalFormsForAgent } from "@/lib/db/queries/external-forms";
import {
  deployedCorsPreflightResponse,
  withDeployedCors,
} from "@/lib/tracking/cors";

type RouteParams = { params: Promise<{ slug: string }> };

export async function OPTIONS(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const agent = await getPublishedAgentBySlug(slug);

  if (!agent) {
    return Response.json({ error: "agent_not_published" }, { status: 404 });
  }

  return deployedCorsPreflightResponse(request.headers.get("origin"), agent);
}

export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const origin = request.headers.get("origin");
  const agent = await getPublishedAgentBySlug(slug);

  if (!agent) {
    return Response.json({ error: "agent_not_published" }, { status: 404 });
  }

  const forms = await listExternalFormsForAgent(agent.id);

  return withDeployedCors(
    Response.json({
      id: agent.id,
      slug: agent.slug,
      name: agent.name,
      forms: forms.map((form) => ({
        id: form.id,
        slug: form.slug,
        name: form.name,
      })),
    }),
    origin,
    agent,
  );
}
