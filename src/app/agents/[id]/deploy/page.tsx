import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { AgentNav } from "@/components/dashboard/agent-nav";
import { ApiKeysManager } from "@/components/deploy/api-keys-manager";
import { ConversationLogs } from "@/components/deploy/conversation-logs";
import { EmbedSettings } from "@/components/deploy/embed-settings";
import { PublishActions } from "@/components/deploy/publish-actions";
import { UsagePanel } from "@/components/deploy/usage-panel";
import { Button } from "@/components/ui/button";
import { getAppUrl } from "@/lib/app-url";
import { getAgentForUser } from "@/lib/db/queries/agents";
import { listApiKeysForAgent } from "@/lib/db/queries/api-keys";
import {
  getAgentUsageSummary,
  listConversationLogs,
} from "@/lib/db/queries/usage";

type DeployPageProps = {
  params: Promise<{ id: string }>;
};

function DeployFallback() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
    </div>
  );
}

async function DeployContent({ params }: DeployPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    notFound();
  }

  const agent = await getAgentForUser(id, userId);
  if (!agent) {
    notFound();
  }

  const [usage, conversations, apiKeys] = await Promise.all([
    getAgentUsageSummary(agent.id),
    listConversationLogs({ agentId: agent.id }),
    listApiKeysForAgent(agent.id),
  ]);

  const widgetTheme = agent.settings.widgetTheme ?? {};
  const published = agent.status === "published";
  const canPublish = agent.userPrompt.trim().length > 0;
  const appUrl = getAppUrl();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-4">
          <AgentNav
            agentId={agent.id}
            agentName={agent.name}
            current="deploy"
          />
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            <span className="font-medium capitalize text-foreground">
              {agent.status}
            </span>
            {agent.publishedAt
              ? ` · Published ${agent.publishedAt.toLocaleString()}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <PublishActions
            agentId={agent.id}
            status={agent.status}
            canPublish={canPublish}
          />
        </div>
      </div>

      <UsagePanel usage={usage} />

      <EmbedSettings
        agentId={agent.id}
        slug={agent.slug}
        appUrl={appUrl}
        published={published}
        initialGreeting={
          typeof widgetTheme.greeting === "string"
            ? widgetTheme.greeting
            : `Hi! I'm ${agent.name}. How can I help?`
        }
        initialPosition={
          widgetTheme.position === "bottom-left"
            ? "bottom-left"
            : "bottom-right"
        }
        initialPrimaryColor={
          typeof widgetTheme.primaryColor === "string"
            ? widgetTheme.primaryColor
            : "#2563eb"
        }
        initialAllowedOrigins={(agent.settings.allowedOrigins ?? []).join("\n")}
        initialModes={
          widgetTheme.modes === "chat+voice" ? "chat+voice" : "chat"
        }
      />

      <ApiKeysManager
        agentId={agent.id}
        published={published}
        initialKeys={apiKeys.map((key) => ({
          id: key.id,
          name: key.name,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
        }))}
      />

      <ConversationLogs
        agentId={agent.id}
        initialConversations={conversations.map((conversation) => ({
          id: conversation.id,
          mode: conversation.mode,
          visitorId: conversation.visitorId,
          createdAt: conversation.createdAt,
          messageCount: Number(conversation.messageCount),
        }))}
      />
    </div>
  );
}

export default function DeployPage({ params }: DeployPageProps) {
  return (
    <Suspense fallback={<DeployFallback />}>
      <DeployContent params={params} />
    </Suspense>
  );
}
