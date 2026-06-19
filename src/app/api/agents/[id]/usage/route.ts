import { auth } from "@/auth";
import { getAgentForUser } from "@/lib/db/queries/agents";
import { getAgentUsageSummary } from "@/lib/db/queries/usage";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
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

  const usage = await getAgentUsageSummary(agentId);

  return Response.json({ usage });
}
