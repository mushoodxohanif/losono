import { auth } from "@/auth";
import {
  deleteContextSource,
  getAgentForUser,
  getContextSourceForAgent,
} from "@/lib/db/queries/context";

type RouteParams = { params: Promise<{ id: string; sourceId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: agentId, sourceId } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const agent = await getAgentForUser(agentId, userId);
  if (!agent) {
    return Response.json({ error: "agent_not_found" }, { status: 404 });
  }

  const source = await getContextSourceForAgent(agentId, sourceId);
  if (!source) {
    return Response.json(
      { error: "context_source_not_found" },
      { status: 404 },
    );
  }

  const deleted = await deleteContextSource(agentId, sourceId);
  if (!deleted) {
    return Response.json(
      { error: "context_source_not_found" },
      { status: 404 },
    );
  }

  return Response.json({ ok: true, id: sourceId });
}
