import { auth } from "@/auth";
import { getSubscriptionByUserId } from "@/lib/billing/subscriptions";
import {
  deleteAgent,
  getAgentForUser,
  updateAgent,
} from "@/lib/db/queries/agents";

type RouteParams = { params: Promise<{ id: string }> };

type UpdateAgentBody = {
  name?: string;
  userPrompt?: string;
  voiceEnabled?: boolean;
};

async function requireOwner(agentId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  }

  const agent = await getAgentForUser(agentId, userId);
  if (!agent) {
    return {
      error: Response.json({ error: "agent_not_found" }, { status: 404 }),
    };
  }

  return { userId, agent };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const { agent } = access;

  return Response.json({
    agent: {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      status: agent.status,
      voiceEnabled: agent.voiceEnabled,
      userPrompt: agent.userPrompt,
      settings: agent.settings,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      publishedAt: agent.publishedAt,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  let body: UpdateAgentBody;
  try {
    body = (await request.json()) as UpdateAgentBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.voiceEnabled === "boolean" && body.voiceEnabled) {
    const subscription = await getSubscriptionByUserId(access.userId);
    if (!subscription?.voiceEnabled) {
      return Response.json(
        {
          error: "voice_not_available",
          message: "Voice requires a Pro subscription",
        },
        { status: 403 },
      );
    }
  }

  if (typeof body.name === "string" && !body.name.trim()) {
    return Response.json({ error: "name_required" }, { status: 400 });
  }

  const agent = await updateAgent(agentId, access.userId, {
    name: body.name,
    userPrompt: body.userPrompt,
    voiceEnabled: body.voiceEnabled,
  });

  if (!agent) {
    return Response.json({ error: "update_failed" }, { status: 500 });
  }

  return Response.json({
    agent: {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      status: agent.status,
      voiceEnabled: agent.voiceEnabled,
      userPrompt: agent.userPrompt,
      updatedAt: agent.updatedAt,
    },
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const deleted = await deleteAgent(agentId, access.userId);
  if (!deleted) {
    return Response.json({ error: "delete_failed" }, { status: 500 });
  }

  return Response.json({ deleted: true });
}
