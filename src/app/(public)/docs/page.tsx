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
          Integrate published Losono agents via the embed widget, REST chat, or
          WebSocket voice.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Choose an integration path</h2>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">
              Embed widget (recommended)
            </p>
            <p className="mt-1">
              Drop a script tag on your site. Chat works immediately after
              publish — no API key required. Voice works the same way when you
              enable{" "}
              <strong className="font-medium text-foreground">
                Chat + voice
              </strong>{" "}
              on the deploy page and have a Pro subscription with voice enabled
              on the agent.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Custom API integration
            </p>
            <p className="mt-1">
              Build your own chat UI or voice client. Create an API key from the
              deploy page and send it as a Bearer token (chat) or query
              parameter (voice). Use this for server-side chat, mobile apps, or
              fully custom frontends — not for the standard embed snippet.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Authentication</h2>
        <p className="text-sm text-muted-foreground">
          API keys are only required for custom integrations outside the hosted
          embed iframe. Create a key from your agent&apos;s deploy page, then
          send it as a Bearer token or voice query parameter.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">
          {`Authorization: Bearer losono_sk_...`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Never expose API keys in public HTML or client-side JavaScript on your
          own domain. The embed widget authenticates through Losono&apos;s
          hosted iframe instead.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Embed widget</h2>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">
          {`<script src="${appUrl}/embed.js" data-agent="your-agent-slug"></script>`}
        </pre>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            The loader opens an iframe to{" "}
            <code>{appUrl}/embed/your-agent-slug</code>. Configure greeting,
            colors, allowed origins, and modes from the deploy page.
          </p>
          <p className="font-medium text-foreground">
            Enabling voice in the embed
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Subscribe to Pro and enable voice on the agent.</li>
            <li>Publish the agent.</li>
            <li>
              On the deploy page, set{" "}
              <strong className="text-foreground">Modes</strong> to{" "}
              <strong className="text-foreground">Chat + voice</strong> and
              save.
            </li>
            <li>Add the script snippet to your site — no API key needed.</li>
          </ol>
          <p>
            Optional attributes:{" "}
            <code>data-position=&quot;bottom-left&quot;</code> or{" "}
            <code>data-position=&quot;bottom-right&quot;</code> (default).
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Chat (streaming)</h2>
        <p className="text-sm text-muted-foreground">
          For custom chat UIs. Requires a Bearer API key.
        </p>
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
        <p className="text-sm text-muted-foreground">
          For custom voice clients built outside the embed widget. Requires Pro,
          voice enabled on the agent, and an API key.
        </p>
        <p className="text-sm font-medium text-foreground">
          1. Check availability
        </p>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">
          {`GET ${appUrl}/api/agents/{agentId}/voice?mode=deploy&apiKey=losono_sk_...&visitorId=optional-visitor-id`}
        </pre>
        <p className="text-sm font-medium text-foreground">
          2. Start a session
        </p>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">
          {`POST ${appUrl}/api/agents/{agentId}/voice?mode=deploy&apiKey=losono_sk_...
Content-Type: application/json

{}`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Returns <code>{`{ "conversationId": "...", "wsUrl": "..." }`}</code>.
          Connect to <code>wsUrl</code>, stream PCM audio frames, and handle
          transcript events. See the playground voice client for reference.
        </p>
        <p className="text-sm text-muted-foreground">
          You can pass the API key as{" "}
          <code>Authorization: Bearer losono_sk_...</code> instead of the{" "}
          <code>apiKey</code> query parameter.
        </p>
      </section>

      <Link href="/dashboard" className="text-sm text-primary hover:underline">
        Back to dashboard
      </Link>
    </main>
  );
}
