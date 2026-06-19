import type { NextRequest } from "next/server";
import {
  resolveVoiceDeployedAccess,
  resolveVoicePlaygroundAccess,
} from "@/lib/auth/deploy-access";
import { startVoiceProxySession } from "@/lib/gemini/voice-proxy";

export const maxDuration = 300;

type RouteParams = { params: Promise<{ id: string }> };

type VoiceMode = "playground" | "deploy";

function getVoiceMode(request: NextRequest): VoiceMode {
  const mode = request.nextUrl.searchParams.get("mode");
  return mode === "deploy" ? "deploy" : "playground";
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: agentId } = await params;
  const mode = getVoiceMode(request);

  if (mode === "playground") {
    const result = await resolveVoicePlaygroundAccess(agentId);

    if (result instanceof Response) {
      return result;
    }

    if (!result.voiceAllowed) {
      return Response.json(
        {
          voiceAvailable: false,
          reason: result.voiceReason,
          code: "voice_unavailable",
        },
        { status: 403 },
      );
    }

    return Response.json({ voiceAvailable: true, mode: "playground" });
  }

  const result = await resolveVoiceDeployedAccess({
    agentId,
    request,
    apiKeyFromQuery: request.nextUrl.searchParams.get("apiKey"),
    visitorId: request.nextUrl.searchParams.get("visitorId") ?? undefined,
  });

  if (result instanceof Response) {
    return result;
  }

  if (!result.voiceAllowed) {
    return Response.json(
      {
        voiceAvailable: false,
        reason: result.voiceReason,
        code: "voice_unavailable",
      },
      { status: 403 },
    );
  }

  return Response.json({ voiceAvailable: true, mode: "deploy" });
}

export function UPGRADE(
  client: import("ws").WebSocket,
  _server: import("ws").WebSocketServer,
  request: NextRequest,
  context: import("next-ws/server").RouteContext<"/api/agents/[id]/voice">,
) {
  void handleVoiceUpgrade(client, request, context);
}

async function handleVoiceUpgrade(
  client: import("ws").WebSocket,
  request: NextRequest,
  context: import("next-ws/server").RouteContext<"/api/agents/[id]/voice">,
) {
  try {
    const { id: agentId } = await context.params;
    const mode = getVoiceMode(request);

    if (mode === "playground") {
      const result = await resolveVoicePlaygroundAccess(agentId);

      if (result instanceof Response) {
        client.close(4401, "Unauthorized");
        return;
      }

      if (!result.voiceAllowed) {
        client.close(4403, result.voiceReason ?? "Voice unavailable");
        return;
      }

      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        client.close(4503, "Gemini not configured");
        return;
      }

      const { default: WebSocketImpl } = await import("ws");

      await startVoiceProxySession({
        client,
        agent: result.agent,
        agentId,
        userId: result.userId,
        mode: "playground",
        WebSocketImpl,
      });
      return;
    }

    const result = await resolveVoiceDeployedAccess({
      agentId,
      request,
      apiKeyFromQuery: request.nextUrl.searchParams.get("apiKey"),
      visitorId: request.nextUrl.searchParams.get("visitorId") ?? undefined,
    });

    if (result instanceof Response) {
      client.close(4401, "Unauthorized");
      return;
    }

    if (!result.voiceAllowed) {
      client.close(4403, result.voiceReason ?? "Voice unavailable");
      return;
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      client.close(4503, "Gemini not configured");
      return;
    }

    const { default: WebSocketImpl } = await import("ws");

    await startVoiceProxySession({
      client,
      agent: result.agent,
      agentId,
      visitorId: result.visitorId,
      mode: "voice",
      WebSocketImpl,
    });
  } catch (error) {
    console.error("Voice upgrade failed:", error);
    client.close(1011, "Voice session failed");
  }
}
