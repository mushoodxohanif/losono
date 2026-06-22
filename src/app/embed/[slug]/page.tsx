import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmbedWidget } from "@/components/embed/embed-widget";
import { getSubscriptionByUserId } from "@/lib/billing/subscriptions";
import { canUseVoiceInPlayground } from "@/lib/billing/voice-access";
import { getPublishedAgentBySlug } from "@/lib/db/queries/agents";

type EmbedPageProps = {
  params: Promise<{ slug: string }>;
};

function EmbedFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="size-10 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

async function EmbedContent({ params }: EmbedPageProps) {
  const { slug } = await params;
  const agent = await getPublishedAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const subscription = await getSubscriptionByUserId(agent.userId);
  const voiceAccess = canUseVoiceInPlayground(subscription, agent);
  const widgetTheme = agent.settings.widgetTheme ?? {};
  const modes = widgetTheme.modes === "chat+voice" ? "chat+voice" : "chat";

  return (
    <EmbedWidget
      agentId={agent.id}
      agentName={agent.name}
      greeting={
        typeof widgetTheme.greeting === "string"
          ? widgetTheme.greeting
          : `Hi! I'm ${agent.name}. How can I help?`
      }
      primaryColor={
        typeof widgetTheme.primaryColor === "string"
          ? widgetTheme.primaryColor
          : "#2563eb"
      }
      voiceEnabled={modes === "chat+voice" && voiceAccess.allowed}
      compact
      defaultOpen={false}
    />
  );
}

export default function EmbedPage({ params }: EmbedPageProps) {
  return (
    <Suspense fallback={<EmbedFallback />}>
      <EmbedContent params={params} />
    </Suspense>
  );
}
