import { auth } from "@/auth";
import { getAgentForUser } from "@/lib/db/queries/agents";
import { createApiKey, listApiKeysForAgent } from "@/lib/db/queries/api-keys";

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

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const keys = await listApiKeysForAgent(agentId);

  return Response.json({
    keys: keys.map((key) => ({
      id: key.id,
      name: key.name,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    })),
  });
}

type CreateKeyBody = {
  name?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  if (access.agent.status !== "published") {
    return Response.json({ error: "agent_not_published" }, { status: 403 });
  }

  let body: CreateKeyBody = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text) as CreateKeyBody;
    }
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = body.name?.trim() || "Default key";

  try {
    const { apiKey, rawKey, displayPrefix } = await createApiKey({
      agentId,
      name,
    });

    return Response.json(
      {
        key: {
          id: apiKey.id,
          name: apiKey.name,
          createdAt: apiKey.createdAt,
          displayPrefix,
        },
        rawKey,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create API key:", error);
    return Response.json({ error: "create_failed" }, { status: 500 });
  }
}
