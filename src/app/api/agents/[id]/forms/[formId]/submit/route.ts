import { resolveDeployedAccess } from "@/lib/auth/deploy-access";
import { getPublishedAgentById } from "@/lib/db/queries/agents";
import {
  deployedCorsPreflightResponse,
  withDeployedCors,
} from "@/lib/tracking/cors";
import { submitRegisteredExternalForm } from "@/lib/tracking/external-forms";

type RouteParams = { params: Promise<{ id: string; formId: string }> };

type RegisteredSubmitBody = {
  visitorId?: string;
  responses?: Record<string, string>;
  pageUrl?: string;
  metadata?: Record<string, unknown>;
};

export async function OPTIONS(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const agent = await getPublishedAgentById(agentId);

  if (!agent) {
    return Response.json({ error: "agent_not_published" }, { status: 403 });
  }

  return deployedCorsPreflightResponse(request.headers.get("origin"), agent);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: agentId, formId } = await params;
  const origin = request.headers.get("origin");

  let body: RegisteredSubmitBody;
  try {
    body = (await request.json()) as RegisteredSubmitBody;
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

  if (!body.responses || typeof body.responses !== "object") {
    return withDeployedCors(
      Response.json({ error: "validation_failed" }, { status: 400 }),
      origin,
      access.agent,
    );
  }

  const result = await submitRegisteredExternalForm({
    agentId,
    formRef: formId,
    visitorId,
    responses: body.responses,
    pageUrl: body.pageUrl?.trim() || null,
    metadata: body.metadata ?? null,
  });

  if ("error" in result) {
    if (result.error === "form_not_found") {
      return withDeployedCors(
        Response.json({ error: "form_not_found" }, { status: 404 }),
        origin,
        access.agent,
      );
    }

    return withDeployedCors(
      Response.json(
        {
          error: "validation_failed",
          details: result.details,
        },
        { status: 400 },
      ),
      origin,
      access.agent,
    );
  }

  return withDeployedCors(
    Response.json({
      submissionId: result.submission.id,
      formId: result.form.id,
      submitted: true,
    }),
    origin,
    access.agent,
  );
}
