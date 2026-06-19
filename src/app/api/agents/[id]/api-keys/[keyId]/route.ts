import { auth } from "@/auth";
import { getAgentForUser } from "@/lib/db/queries/agents";
import { revokeApiKey } from "@/lib/db/queries/api-keys";

type RouteParams = { params: Promise<{ id: string; keyId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: agentId, keyId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const agent = await getAgentForUser(agentId, userId);
  if (!agent) {
    return Response.json({ error: "agent_not_found" }, { status: 404 });
  }

  const revoked = await revokeApiKey(agentId, keyId);
  if (!revoked) {
    return Response.json({ error: "key_not_found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
