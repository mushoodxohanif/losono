import { isOriginAllowed } from "@/lib/auth/deploy-access";
import type { Agent } from "@/lib/db/schema";

export function withDeployedCors(
  response: Response,
  origin: string | null,
  agent: Agent,
): Response {
  if (!origin || !isOriginAllowed(agent, origin)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function deployedCorsPreflightResponse(
  origin: string | null,
  agent: Agent,
): Response {
  return withDeployedCors(new Response(null, { status: 204 }), origin, agent);
}
