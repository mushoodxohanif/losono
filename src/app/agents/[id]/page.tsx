import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { AgentNav } from "@/components/dashboard/agent-nav";
import { AgentSettingsForm } from "@/components/dashboard/agent-settings-form";
import { Button } from "@/components/ui/button";
import { getSubscriptionByUserId } from "@/lib/billing/subscriptions";
import { getAgentForUser } from "@/lib/db/queries/agents";

type AgentSettingsPageProps = {
  params: Promise<{ id: string }>;
};

function SettingsFallback() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
    </div>
  );
}

async function SettingsContent({ params }: AgentSettingsPageProps) {
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

  const subscription = await getSubscriptionByUserId(userId);
  const voiceAvailable = subscription?.voiceEnabled ?? false;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AgentNav
          agentId={agent.id}
          agentName={agent.name}
          current="settings"
        />
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>

      <AgentSettingsForm
        agentId={agent.id}
        initialName={agent.name}
        initialUserPrompt={agent.userPrompt}
        initialVoiceEnabled={agent.voiceEnabled}
        voiceAvailable={voiceAvailable}
      />
    </div>
  );
}

export default function AgentSettingsPage({ params }: AgentSettingsPageProps) {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsContent params={params} />
    </Suspense>
  );
}
