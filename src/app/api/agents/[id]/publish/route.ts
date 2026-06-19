import { auth } from "@/auth";
import {
  getAgentForUser,
  publishAgent,
  unpublishAgent,
} from "@/lib/db/queries/agents";

type RouteParams = { params: Promise<{ id: string }> };

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

export async function POST(_request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const agent = await publishAgent(agentId, access.userId);
  if (!agent) {
    return Response.json(
      {
        error: "publish_failed",
        message: "Add a user prompt before publishing",
      },
      { status: 400 },
    );
  }

  return Response.json({
    agent: {
      id: agent.id,
      status: agent.status,
      slug: agent.slug,
      publishedAt: agent.publishedAt,
    },
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const agent = await unpublishAgent(agentId, access.userId);
  if (!agent) {
    return Response.json({ error: "unpublish_failed" }, { status: 500 });
  }

  return Response.json({
    agent: {
      id: agent.id,
      status: agent.status,
      publishedAt: agent.publishedAt,
    },
  });
}
