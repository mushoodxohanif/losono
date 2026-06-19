import Link from "next/link";
import { getAppUrl } from "@/lib/app-url";

export default function DocsPage() {
  const appUrl = getAppUrl();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 pb-16 pt-24 sm:pt-28">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Developers</p>
        <h1 className="text-3xl font-semibold tracking-tight">API reference</h1>
        <p className="text-muted-foreground">
          Integrate published Losono agents via REST chat, WebSocket voice, or
          the embed widget.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Authentication</h2>
        <p className="text-sm text-muted-foreground">
          Create an API key from your agent&apos;s deploy page, then send it as
          a Bearer token.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">
          {`Authorization: Bearer losono_sk_...`}
        </pre>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Chat (streaming)</h2>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">
          {`POST ${appUrl}/api/agents/{agentId}/chat
Content-Type: application/json
Authorization: Bearer losono_sk_...

{
  "mode": "chat",
  "visitorId": "optional-visitor-id",
  "conversationId": "optional-existing-conversation",
  "messages": [
    { "role": "user", "parts": [{ "type": "text", "text": "Hello" }] }
  ]
}`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Response is an AI SDK UI message stream. The conversation id is
          returned in the <code>X-Conversation-Id</code> header.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Voice (WebSocket)</h2>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">
          {`GET ${appUrl}/api/agents/{agentId}/voice?mode=deploy&apiKey=losono_sk_...

WebSocket upgrade with PCM audio frames (see playground client).`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Voice requires a Pro subscription with voice enabled on the agent.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Embed widget</h2>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">
          {`<script src="${appUrl}/embed.js" data-agent="your-agent-slug"></script>`}
        </pre>
        <p className="text-sm text-muted-foreground">
          The loader opens an iframe to{" "}
          <code>{appUrl}/embed/your-agent-slug</code>. Configure greeting,
          colors, and allowed origins from the deploy page.
        </p>
      </section>

      <Link href="/dashboard" className="text-sm text-primary hover:underline">
        Back to dashboard
      </Link>
    </main>
  );
}
