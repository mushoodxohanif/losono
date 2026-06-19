import { auth } from "@/auth";
import { getAgentForUser } from "@/lib/db/queries/agents";
import {
  getConversationWithMessages,
  listConversationLogs,
} from "@/lib/db/queries/usage";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
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

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");

  if (conversationId) {
    const detail = await getConversationWithMessages({
      agentId,
      conversationId,
    });

    if (!detail) {
      return Response.json(
        { error: "conversation_not_found" },
        { status: 404 },
      );
    }

    return Response.json(detail);
  }

  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const conversations = await listConversationLogs({
    agentId,
    limit: Number.isFinite(limit) ? limit : 50,
  });

  return Response.json({ conversations });
}
