import Link from "next/link";
import {
  CodeBlock,
  DocsCard,
  DocsSection,
  DocsStep,
  DocsStepList,
  DocsSubsection,
} from "@/components/docs/code-block";

type DocsContentProps = {
  appUrl: string;
};

const toc = [
  { href: "#overview", label: "Overview" },
  { href: "#comparison", label: "Choose an integration" },
  { href: "#embed-widget", label: "Embed widget guide" },
  { href: "#custom-api", label: "Custom API guide" },
  { href: "#authentication", label: "Authentication" },
  { href: "#message-format", label: "Message format" },
  { href: "#errors", label: "Error codes" },
];

export function DocsContent({ appUrl }: DocsContentProps) {
  const exampleSlug = "your-agent-slug";
  const exampleAgentId = "550e8400-e29b-41d4-a716-446655440000";
  const exampleApiKey = "losono_sk_...";
  const embedScript = `<script src="${appUrl}/embed.js" data-agent="${exampleSlug}"></script>`;
  const embedScriptPosition = `<script
  src="${appUrl}/embed.js"
  data-agent="${exampleSlug}"
  data-position="bottom-left">
</script>`;
  const embedUrl = `${appUrl}/embed/${exampleSlug}`;
  const chatEndpoint = `${appUrl}/api/agents/${exampleAgentId}/chat`;
  const voiceEndpoint = `${appUrl}/api/agents/${exampleAgentId}/voice?mode=deploy`;

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
      <nav
        aria-label="Documentation table of contents"
        className="hidden shrink-0 lg:sticky lg:top-28 lg:block lg:w-52"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          On this page
        </p>
        <ul className="space-y-2 text-sm">
          {toc.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 space-y-10">
        <header id="overview" className="scroll-mt-28 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Developers
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Integration guide
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Losono agents can be integrated in two ways: a drop-in embed widget
            for websites, or a custom API integration for server-side chat,
            mobile apps, and bespoke UIs. Both paths use the same published
            agent, RAG context, and billing — they differ in setup, auth, and
            who builds the interface.
          </p>
          <DocsCard>
            <p className="text-sm font-medium">Quick reference</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Embed loader</dt>
                <dd>
                  <code className="text-xs">{appUrl}/embed.js</code>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Hosted widget</dt>
                <dd>
                  <code className="text-xs">
                    {appUrl}/embed/{"{slug}"}
                  </code>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Chat API</dt>
                <dd>
                  <code className="text-xs">
                    POST {appUrl}/api/agents/{"{agentId}"}/chat
                  </code>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Voice API</dt>
                <dd>
                  <code className="text-xs">
                    GET/POST {appUrl}/api/agents/{"{agentId}"}/voice?mode=deploy
                  </code>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">API key prefix</dt>
                <dd>
                  <code className="text-xs">losono_sk_</code>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Agent identifiers</dt>
                <dd className="text-muted-foreground">
                  Embed uses <strong className="text-foreground">slug</strong> ·
                  API uses <strong className="text-foreground">agentId</strong>{" "}
                  (UUID from dashboard URL)
                </dd>
              </div>
            </dl>
          </DocsCard>
        </header>

        <DocsSection
          id="comparison"
          title="Choose an integration"
          description="Pick the path that matches your product. You can use both on the same agent."
        >
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium"> </th>
                  <th className="px-4 py-3 font-medium">Embed widget</th>
                  <th className="px-4 py-3 font-medium">Custom API</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 text-muted-foreground">Best for</td>
                  <td className="px-4 py-3">
                    Marketing sites, docs, Shopify, Webflow
                  </td>
                  <td className="px-4 py-3">
                    Server-side chat, mobile apps, fully custom UI
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground">
                    Setup time
                  </td>
                  <td className="px-4 py-3">One script tag</td>
                  <td className="px-4 py-3">API key + HTTP/WebSocket client</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground">API key</td>
                  <td className="px-4 py-3">Not required</td>
                  <td className="px-4 py-3">
                    Required (or allowed-origin browser calls)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground">Chat</td>
                  <td className="px-4 py-3">Built-in UI</td>
                  <td className="px-4 py-3">
                    You implement UI + streaming parser
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground">Voice</td>
                  <td className="px-4 py-3">
                    Toggle on deploy page (Pro plan)
                  </td>
                  <td className="px-4 py-3">
                    WebSocket to Gemini Live via session token (Pro plan)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground">
                    Identifier
                  </td>
                  <td className="px-4 py-3">
                    <code>data-agent=&quot;slug&quot;</code>
                  </td>
                  <td className="px-4 py-3">
                    <code>agentId</code> in URL path
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DocsSection>

        <DocsSection
          id="embed-widget"
          title="Embed widget (recommended)"
          description="Add a floating chat launcher to any website with a single script tag. Losono hosts the widget UI in a secure iframe — no API key is exposed on your domain."
        >
          <DocsCard>
            <DocsSubsection title="When to use the embed">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>You want the fastest path to production on a website.</li>
                <li>
                  You are fine with Losono&apos;s default chat (and optional
                  voice) UI.
                </li>
                <li>You do not want to manage API keys in your frontend.</li>
                <li>
                  You need chat + optional voice without building WebSocket
                  audio capture.
                </li>
              </ul>
            </DocsSubsection>

            <DocsSubsection title="Prerequisites">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  A Losono account with at least one agent configured (prompt +
                  optional context files).
                </li>
                <li>
                  The agent must be{" "}
                  <strong className="text-foreground">published</strong>.
                </li>
                <li>
                  For voice in the embed: Pro subscription, voice enabled on the
                  agent, and{" "}
                  <strong className="text-foreground">Chat + voice</strong> mode
                  on the deploy page.
                </li>
              </ul>
            </DocsSubsection>

            <DocsSubsection title="Step-by-step">
              <DocsStepList>
                <DocsStep title="1. Create and configure your agent">
                  <p>
                    Sign in to the{" "}
                    <Link
                      href="/dashboard"
                      className="text-primary hover:underline"
                    >
                      dashboard
                    </Link>
                    , create an agent, write a system prompt, and upload any
                    context documents you want the agent to reference.
                  </p>
                </DocsStep>

                <DocsStep title="2. Test in the playground">
                  <p>
                    Open the agent playground and verify chat (and voice, if
                    needed) before going live. Playground mode uses your
                    logged-in session — it is separate from the public embed.
                  </p>
                </DocsStep>

                <DocsStep title="3. Publish the agent">
                  <p>
                    Go to <strong className="text-foreground">Deploy</strong>{" "}
                    and click{" "}
                    <strong className="text-foreground">Publish</strong>. The
                    embed URL and script snippet are inactive until the agent is
                    published.
                  </p>
                </DocsStep>

                <DocsStep title="4. Configure embed settings (optional)">
                  <p>On the deploy page, customize:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      <strong className="text-foreground">Greeting</strong> —
                      first message shown in the widget
                    </li>
                    <li>
                      <strong className="text-foreground">Primary color</strong>{" "}
                      — header and user bubble color
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Launcher position
                      </strong>{" "}
                      — bottom-right (default) or bottom-left
                    </li>
                    <li>
                      <strong className="text-foreground">Modes</strong> — chat
                      only, or chat + voice
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Allowed origins
                      </strong>{" "}
                      — restrict which domains may call the chat API from the
                      iframe (empty = allow all)
                    </li>
                  </ul>
                  <p>
                    Click{" "}
                    <strong className="text-foreground">
                      Save embed settings
                    </strong>{" "}
                    after changes.
                  </p>
                </DocsStep>

                <DocsStep title="5. Copy the script snippet">
                  <p>
                    From the deploy page, copy the script snippet. It looks like
                    this:
                  </p>
                  <CodeBlock>{embedScript}</CodeBlock>
                </DocsStep>

                <DocsStep title="6. Add the script to your site">
                  <p>
                    Paste the snippet before the closing{" "}
                    <code>&lt;/body&gt;</code> tag on every page where you want
                    the widget. The loader creates a fixed-position iframe
                    pointing at Losono&apos;s hosted widget.
                  </p>
                  <CodeBlock title="Minimal HTML example">
                    {`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My site</title>
  </head>
  <body>
    <h1>Welcome</h1>

    <!-- Losono embed — one line -->
    ${embedScript}
  </body>
</html>`}
                  </CodeBlock>
                </DocsStep>

                <DocsStep title="7. Verify">
                  <p>
                    Load your site. You should see a circular launcher in the
                    corner. Click it to open chat. Messages stream in real time
                    and conversations persist per browser via localStorage.
                  </p>
                </DocsStep>
              </DocsStepList>
            </DocsSubsection>

            <DocsSubsection id="embed-script-options" title="Script attributes">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="px-4 py-2 font-medium">Attribute</th>
                      <th className="px-4 py-2 font-medium">Required</th>
                      <th className="px-4 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-2">
                        <code>data-agent</code>
                      </td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        Published agent slug (from deploy page)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">
                        <code>data-position</code>
                      </td>
                      <td className="px-4 py-2">No</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        <code>bottom-right</code> (default) or{" "}
                        <code>bottom-left</code>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">
                        <code>src</code>
                      </td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        Must point at <code>{appUrl}/embed.js</code>. The loader
                        derives the iframe origin from this URL.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <CodeBlock title="Custom launcher position">
                {embedScriptPosition}
              </CodeBlock>
            </DocsSubsection>

            <DocsSubsection
              id="embed-voice"
              title="Enabling voice in the embed"
            >
              <DocsStepList>
                <DocsStep title="1. Upgrade to Pro and enable voice on the agent">
                  <p>
                    Voice requires an active Pro subscription and voice enabled
                    for that agent in the dashboard.
                  </p>
                </DocsStep>
                <DocsStep title="2. Set modes to Chat + voice">
                  <p>
                    On the deploy page, change{" "}
                    <strong className="text-foreground">Modes</strong> to{" "}
                    <strong className="text-foreground">Chat + voice</strong>{" "}
                    and save.
                  </p>
                </DocsStep>
                <DocsStep title="3. Redeploy the script (no changes needed)">
                  <p>
                    The hosted iframe picks up settings server-side. Users will
                    see Chat and Voice tabs inside the widget. Microphone
                    permission is requested when starting a voice session.
                  </p>
                </DocsStep>
              </DocsStepList>
              <p className="text-sm text-muted-foreground">
                The embed loader sets <code>allow=&quot;microphone&quot;</code>{" "}
                on the iframe so voice works inside the hosted widget.
              </p>
            </DocsSubsection>

            <DocsSubsection
              id="embed-iframe"
              title="Alternative: direct iframe URL"
            >
              <p className="text-sm text-muted-foreground">
                Instead of the script loader, you can embed the full widget page
                directly. Useful for internal tools or when you control iframe
                sizing yourself.
              </p>
              <CodeBlock>{`<iframe
  src="${embedUrl}"
  title="Losono agent"
  allow="microphone"
  style="border:0;width:400px;height:640px;">
</iframe>`}</CodeBlock>
              <p className="text-sm text-muted-foreground">
                Hosted URL: <code>{embedUrl}</code>
              </p>
            </DocsSubsection>

            <DocsSubsection
              id="embed-how-it-works"
              title="How the embed works (for implementers and LLMs)"
            >
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  <code>embed.js</code> reads <code>data-agent</code> and
                  creates an iframe at{" "}
                  <code>
                    {appUrl}/embed/{"{slug}"}
                  </code>
                  .
                </li>
                <li>
                  The iframe loads Losono&apos;s <code>EmbedWidget</code>{" "}
                  component, which calls{" "}
                  <code>POST /api/agents/{"{agentId}"}/chat</code> with{" "}
                  <code>mode: &quot;chat&quot;</code> and a generated{" "}
                  <code>visitorId</code>.
                </li>
                <li>
                  Auth for chat requests from the iframe uses the{" "}
                  <code>Referer</code> header (<code>/embed/{"{slug}"}</code>) —
                  no API key on your domain.
                </li>
                <li>
                  The parent page and iframe communicate via{" "}
                  <code>postMessage</code> (<code>losono:embed:resize</code>,{" "}
                  <code>losono:embed:close</code>) to resize the launcher and
                  handle overlay clicks.
                </li>
                <li>
                  Conversations and messages are stored in the visitor&apos;s
                  browser localStorage under keys prefixed with{" "}
                  <code>losono_</code>.
                </li>
              </ol>
            </DocsSubsection>
          </DocsCard>
        </DocsSection>

        <DocsSection
          id="custom-api"
          title="Custom API integration"
          description="Build your own chat UI or voice client. Use a server-side API key for backend integrations; use allowed origins only when you must call chat from a browser without exposing a secret."
        >
          <DocsCard>
            <DocsSubsection title="When to use the custom API">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  Chat runs on your server (e.g. support ticket enrichment,
                  Slack bot).
                </li>
                <li>
                  You need a fully branded UI that does not use the Losono
                  widget.
                </li>
                <li>You are building a mobile or desktop app.</li>
                <li>
                  You want programmatic control over message history and
                  streaming.
                </li>
              </ul>
            </DocsSubsection>

            <DocsSubsection title="Prerequisites">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  Agent is{" "}
                  <strong className="text-foreground">published</strong>.
                </li>
                <li>
                  You know the agent&apos;s{" "}
                  <strong className="text-foreground">agentId</strong> (UUID in
                  the dashboard URL: <code>/agents/{"{agentId}"}/...</code>).
                </li>
                <li>
                  An API key created on the deploy page (for server-side or
                  voice).
                </li>
                <li>
                  For voice: Pro plan, voice enabled on the agent, and a client
                  that can capture/play PCM audio.
                </li>
              </ul>
            </DocsSubsection>

            <DocsSubsection title="Step-by-step">
              <DocsStepList>
                <DocsStep title="1. Publish the agent">
                  <p>
                    Same as the embed path — the agent must be published before
                    deploy APIs accept traffic.
                  </p>
                </DocsStep>

                <DocsStep title="2. Copy the agent ID">
                  <p>
                    Open your agent in the dashboard. The URL contains the UUID:
                  </p>
                  <CodeBlock>{`/agents/${exampleAgentId}/deploy`}</CodeBlock>
                  <p>
                    Use this <code>agentId</code> in all API paths. Do not
                    confuse it with the embed <code>slug</code>.
                  </p>
                </DocsStep>

                <DocsStep title="3. Create an API key">
                  <p>
                    On the deploy page, enter a key name (e.g. &quot;Production
                    backend&quot;) and click{" "}
                    <strong className="text-foreground">Generate key</strong>.
                    Copy the secret immediately — it is shown only once.
                  </p>
                  <CodeBlock>{exampleApiKey}</CodeBlock>
                  <p className="text-sm text-destructive/90">
                    Store keys in environment variables or a secrets manager.
                    Never commit them to git or ship them in client-side
                    bundles.
                  </p>
                </DocsStep>

                <DocsStep title="4. Send a chat message">
                  <p>
                    POST to the chat endpoint with{" "}
                    <code>mode: &quot;chat&quot;</code> (required for deployed
                    access). Include the full message history on each request.
                  </p>
                  <CodeBlock title="curl — streaming chat">
                    {`curl -N -X POST "${chatEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${exampleApiKey}" \\
  -d '{
    "mode": "chat",
    "visitorId": "user-123",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "parts": [{ "type": "text", "text": "What are your hours?" }]
      }
    ]
  }'`}
                  </CodeBlock>
                  <p className="text-sm text-muted-foreground">
                    The response is an AI SDK UI message stream. Read{" "}
                    <code>X-Conversation-Id</code> from response headers and
                    pass it on the next request to continue the same
                    conversation.
                  </p>
                </DocsStep>

                <DocsStep title="5. (Optional) Add voice">
                  <p>
                    Check availability, start a session, connect to the returned
                    WebSocket URL, and stream PCM audio. See the voice section
                    below for the full protocol.
                  </p>
                </DocsStep>
              </DocsStepList>
            </DocsSubsection>
          </DocsCard>

          <DocsCard>
            <DocsSubsection id="chat-api" title="Chat API reference">
              <p className="text-sm text-muted-foreground">
                <code>
                  POST {appUrl}/api/agents/{"{agentId}"}/chat
                </code>
              </p>

              <p className="text-sm font-medium">Request body</p>
              <CodeBlock>
                {`{
  "mode": "chat",
  "visitorId": "optional-stable-visitor-id",
  "conversationId": "optional-existing-conversation-uuid",
  "messages": [
    {
      "id": "unique-message-id",
      "role": "user",
      "parts": [{ "type": "text", "text": "Hello" }]
    }
  ]
}`}
              </CodeBlock>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="px-4 py-2 font-medium">Field</th>
                      <th className="px-4 py-2 font-medium">Required</th>
                      <th className="px-4 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-muted-foreground">
                    <tr>
                      <td className="px-4 py-2">
                        <code>mode</code>
                      </td>
                      <td className="px-4 py-2">Yes*</td>
                      <td className="px-4 py-2">
                        Must be <code>&quot;chat&quot;</code> for production.
                        Default <code>&quot;playground&quot;</code> is
                        dashboard-only (session auth).
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">
                        <code>messages</code>
                      </td>
                      <td className="px-4 py-2">Yes</td>
                      <td className="px-4 py-2">
                        Non-empty array. Last user message is used for RAG
                        retrieval.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">
                        <code>conversationId</code>
                      </td>
                      <td className="px-4 py-2">No</td>
                      <td className="px-4 py-2">
                        Omit on first message; reuse value from{" "}
                        <code>X-Conversation-Id</code> header afterward.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">
                        <code>visitorId</code>
                      </td>
                      <td className="px-4 py-2">No</td>
                      <td className="px-4 py-2">
                        Stable ID for analytics and conversation grouping in
                        logs.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm font-medium">Response</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Body: AI SDK UI message stream (SSE-compatible)</li>
                <li>
                  Header: <code>X-Conversation-Id: {"{uuid}"}</code>
                </li>
              </ul>

              <CodeBlock title="Node.js — server-side chat (no streaming UI)">
                {`const AGENT_ID = "${exampleAgentId}";
const API_KEY = process.env.LOSONO_API_KEY;

async function askLosono(userText, conversationId) {
  const response = await fetch(
    \`${appUrl}/api/agents/\${AGENT_ID}/chat\`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${API_KEY}\`,
      },
      body: JSON.stringify({
        mode: "chat",
        conversationId,
        visitorId: "server-job-1",
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text", text: userText }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(\`Chat failed: \${response.status}\`);
  }

  const nextConversationId =
    response.headers.get("X-Conversation-Id") ?? conversationId;

  // Parse AI SDK stream — use @ai-sdk/ui-utils or your preferred parser
  const text = await response.text();
  return { text, conversationId: nextConversationId };
}`}
              </CodeBlock>

              <CodeBlock title="React — streaming with AI SDK">
                {`import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const AGENT_ID = "${exampleAgentId}";
const API_KEY = process.env.NEXT_PUBLIC_LOSONO_KEY; // only if proxied — prefer a server route

export function CustomChat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: \`/api/agents/\${AGENT_ID}/chat\`,
      headers: { Authorization: \`Bearer \${API_KEY}\` },
      body: { mode: "chat", visitorId: "web-user-1" },
    }),
  });

  // Render messages and an input that calls sendMessage({ text: "..." })
}`}
              </CodeBlock>
              <p className="text-sm text-muted-foreground">
                Recommended pattern: expose a thin API route on your server that
                attaches the Bearer token, so the key never ships to browsers.
              </p>
            </DocsSubsection>
          </DocsCard>

          <DocsCard>
            <DocsSubsection id="voice-api" title="Voice API reference">
              <p className="text-sm text-muted-foreground">
                Voice requires Pro, voice enabled on the agent, and{" "}
                <code>?mode=deploy</code> on all voice routes. Reference
                implementation:{" "}
                <code>src/components/voice/agent-voice.tsx</code>.
              </p>

              <DocsStepList>
                <DocsStep title="1. Check availability">
                  <CodeBlock>
                    {`GET ${voiceEndpoint}&apiKey=${exampleApiKey}&visitorId=optional

// 200 OK
{ "voiceAvailable": true, "mode": "deploy" }

// 403 — voice not available on this plan/agent
{ "voiceAvailable": false, "reason": "...", "code": "voice_unavailable" }`}
                  </CodeBlock>
                </DocsStep>

                <DocsStep title="2. Start a session">
                  <CodeBlock>
                    {`POST ${voiceEndpoint}&apiKey=${exampleApiKey}
Content-Type: application/json

{}

// 200 OK
{
  "conversationId": "uuid",
  "preview": { "userPrompt": "...", "context": [...] },
  "wsUrl": "wss://generativelanguage.googleapis.com/ws/...?access_token=..."
}`}
                  </CodeBlock>
                  <p className="text-sm text-muted-foreground">
                    You can pass the API key as{" "}
                    <code>Authorization: Bearer {exampleApiKey}</code> instead
                    of the <code>apiKey</code> query parameter.
                  </p>
                </DocsStep>

                <DocsStep title="3. Connect to WebSocket and send setup">
                  <p className="text-sm text-muted-foreground">
                    Open <code>wsUrl</code> in a WebSocket client. On open, send
                    an empty setup frame (system prompt is locked in the
                    ephemeral token):
                  </p>
                  <CodeBlock>{`{ "setup": {} }`}</CodeBlock>
                  <p className="text-sm text-muted-foreground">
                    Wait for <code>setupComplete</code> in the first server
                    message before streaming audio.
                  </p>
                </DocsStep>

                <DocsStep title="4. Stream microphone audio">
                  <p className="text-sm text-muted-foreground">
                    Send 16 kHz PCM chunks as base64 inside Gemini realtime
                    input frames:
                  </p>
                  <CodeBlock>
                    {`{
  "realtimeInput": {
    "audio": {
      "mimeType": "audio/pcm;rate=16000",
      "data": "<base64-encoded-int16-pcm>"
    }
  }
}`}
                  </CodeBlock>
                  <p className="text-sm text-muted-foreground">
                    Losono ships AudioWorklet processors at{" "}
                    <code>/audio-worklets/capture-processor.js</code> and{" "}
                    <code>/audio-worklets/playback-processor.js</code> for
                    browser clients. Playback audio arrives as base64 PCM at 24
                    kHz in server messages.
                  </p>
                </DocsStep>

                <DocsStep title="5. Handle server events">
                  <p className="text-sm text-muted-foreground">
                    Parse Gemini Live WebSocket messages for:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>
                      <code>inputTranscription</code> /{" "}
                      <code>outputTranscription</code> — show live captions
                    </li>
                    <li>
                      <code>modelTurn.parts[].inlineData</code> — assistant
                      audio (base64 PCM)
                    </li>
                    <li>
                      <code>interrupted</code> / <code>turnComplete</code> —
                      turn boundaries
                    </li>
                  </ul>
                </DocsStep>

                <DocsStep title="6. Persist transcripts (optional)">
                  <CodeBlock>
                    {`PATCH ${voiceEndpoint}&apiKey=${exampleApiKey}
Content-Type: application/json

{
  "action": "transcript",
  "conversationId": "uuid-from-session",
  "role": "user",
  "text": "Transcribed user speech"
}`}
                  </CodeBlock>
                </DocsStep>

                <DocsStep title="7. End session and record usage">
                  <CodeBlock>
                    {`PATCH ${voiceEndpoint}&apiKey=${exampleApiKey}
Content-Type: application/json

{
  "action": "complete",
  "conversationId": "uuid-from-session",
  "sessionStartedAt": 1710000000000
}`}
                  </CodeBlock>
                  <p className="text-sm text-muted-foreground">
                    Call this when the user hangs up so voice minutes are billed
                    correctly.
                  </p>
                </DocsStep>
              </DocsStepList>
            </DocsSubsection>
          </DocsCard>
        </DocsSection>

        <DocsSection
          id="authentication"
          title="Authentication"
          description="How Losono validates requests depends on the integration path."
        >
          <DocsCard>
            <DocsSubsection title="Embed widget">
              <p className="text-sm text-muted-foreground">
                No API key. Chat and voice requests from the hosted iframe
                authenticate via the <code>Referer</code> header (
                <code>
                  {appUrl}/embed/{"{slug}"}
                </code>
                ).
              </p>
            </DocsSubsection>

            <DocsSubsection title="Custom API — Bearer token (recommended)">
              <CodeBlock>{`Authorization: Bearer losono_sk_...`}</CodeBlock>
              <p className="text-sm text-muted-foreground">
                Create keys on the agent deploy page. Keys use the{" "}
                <code>losono_sk_</code> prefix and are stored hashed
                server-side. Revoke compromised keys immediately from the
                dashboard.
              </p>
            </DocsSubsection>

            <DocsSubsection title="Custom API — allowed origins (browser only)">
              <p className="text-sm text-muted-foreground">
                If you configure{" "}
                <strong className="text-foreground">Allowed origins</strong> on
                the deploy page and call chat from a browser whose{" "}
                <code>Origin</code> matches, requests may succeed without a
                Bearer token. This is intended for same-site frontends you
                control — prefer server-side keys for anything sensitive.
              </p>
              <p className="text-sm text-muted-foreground">
                Allowed entries can be full origins (
                <code>https://app.example.com</code>), hostnames, or wildcards
                like <code>*.example.com</code>. Empty list = allow all origins.
              </p>
            </DocsSubsection>

            <DocsSubsection title="Voice API key placement">
              <p className="text-sm text-muted-foreground">
                Voice routes accept the key as either:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>
                  <code>Authorization: Bearer losono_sk_...</code> header, or
                </li>
                <li>
                  <code>?apiKey=losono_sk_...</code> query parameter (useful for
                  WebSocket-adjacent fetch calls)
                </li>
              </ul>
            </DocsSubsection>
          </DocsCard>
        </DocsSection>

        <DocsSection
          id="message-format"
          title="Message format"
          description="Chat uses Vercel AI SDK UI messages. Each message has a role and a parts array."
        >
          <DocsCard>
            <CodeBlock>
              {`{
  "id": "unique-string",
  "role": "user" | "assistant" | "system",
  "parts": [
    { "type": "text", "text": "Message content" }
  ]
}`}
            </CodeBlock>
            <p className="text-sm text-muted-foreground">
              Send the full conversation history on every chat request. The API
              extracts text from the last user message for RAG retrieval and
              persists both user and assistant turns when streaming completes.
            </p>
            <p className="text-sm text-muted-foreground">
              Streaming responses follow the AI SDK UI message stream protocol.
              Use <code>@ai-sdk/react</code> with{" "}
              <code>DefaultChatTransport</code> or parse SSE events manually.
            </p>
          </DocsCard>
        </DocsSection>

        <DocsSection
          id="errors"
          title="Error codes"
          description="Common JSON error bodies returned by deploy APIs."
        >
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium">HTTP</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  [
                    "401",
                    "unauthorized",
                    "Missing or invalid auth (API key, origin, or referer)",
                  ],
                  [
                    "401",
                    "invalid_api_key",
                    "Bearer token is not a valid active key for this agent",
                  ],
                  [
                    "403",
                    "agent_not_published",
                    "Agent exists but is not published",
                  ],
                  [
                    "400",
                    "messages_required",
                    "Chat body missing messages array",
                  ],
                  [
                    "400",
                    "user_message_required",
                    "No non-empty user text in messages",
                  ],
                  ["400", "invalid_mode", "mode must be chat or playground"],
                  [
                    "403",
                    "voice_unavailable",
                    "Pro/voice not enabled or not allowed for this agent",
                  ],
                  [
                    "503",
                    "gemini_not_configured",
                    "Server missing GOOGLE_GENERATIVE_AI_API_KEY",
                  ],
                  [
                    "500",
                    "conversation_failed",
                    "Could not create or load conversation",
                  ],
                  ["500", "retrieval_failed", "RAG retrieval error"],
                ].map(([http, code, meaning]) => (
                  <tr key={code}>
                    <td className="px-4 py-3 text-muted-foreground">{http}</td>
                    <td className="px-4 py-3">
                      <code>{code}</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocsSection>

        <footer className="flex flex-wrap gap-4 border-t border-border pt-8 text-sm">
          <Link href="/dashboard" className="text-primary hover:underline">
            Open dashboard
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            Back to home
          </Link>
        </footer>
      </div>
    </div>
  );
}
