import { resolveDeployedAccess } from "@/lib/auth/deploy-access";
import { getPublishedAgentById } from "@/lib/db/queries/agents";
import {
  deployedCorsPreflightResponse,
  withDeployedCors,
} from "@/lib/tracking/cors";
import { submitFreeformExternalForm } from "@/lib/tracking/external-forms";

type RouteParams = { params: Promise<{ id: string }> };

type FreeformSubmitBody = {
  visitorId?: string;
  responses?: Record<string, string>;
  formName?: string;
  pageUrl?: string;
  metadata?: Record<string, unknown>;
};

function normalizeResponses(
  responses: Record<string, unknown> | undefined,
): Record<string, string> | null {
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
    return null;
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(responses)) {
    if (typeof value !== "string" && typeof value !== "number") {
      continue;
    }
    normalized[key] = String(value);
  }

  if (Object.keys(normalized).length === 0) {
    return null;
  }

  return normalized;
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

  let body: FreeformSubmitBody;
  try {
    body = (await request.json()) as FreeformSubmitBody;
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

  const responses = normalizeResponses(body.responses);
  if (!responses) {
    return withDeployedCors(
      Response.json({ error: "validation_failed" }, { status: 400 }),
      origin,
      access.agent,
    );
  }

  const submission = await submitFreeformExternalForm({
    agentId,
    visitorId,
    responses,
    formName: body.formName?.trim() || null,
    pageUrl: body.pageUrl?.trim() || null,
    metadata: body.metadata ?? null,
  });

  return withDeployedCors(
    Response.json({
      submissionId: submission.id,
      submitted: true,
    }),
    origin,
    access.agent,
  );
}
