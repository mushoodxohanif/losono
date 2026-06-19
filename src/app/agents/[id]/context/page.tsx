import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { AgentNav } from "@/components/dashboard/agent-nav";
import { ContextManager } from "@/components/dashboard/context-manager";
import { Button } from "@/components/ui/button";
import { getSubscriptionByUserId } from "@/lib/billing/subscriptions";
import { getAgentForUser } from "@/lib/db/queries/agents";
import {
  getContextFileLimit,
  listContextSources,
} from "@/lib/db/queries/context";
import { MAX_CONTEXT_FILE_BYTES } from "@/lib/rag/constants";
import { listAllowedMimeTypes } from "@/lib/rag/mime";

type ContextPageProps = {
  params: Promise<{ id: string }>;
};

function ContextFallback() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
    </div>
  );
}

async function ContextContent({ params }: ContextPageProps) {
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

  const [subscription, sources] = await Promise.all([
    getSubscriptionByUserId(userId),
    listContextSources(agent.id),
  ]);

  const limit = getContextFileLimit(subscription);
  const used = sources.length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AgentNav agentId={agent.id} agentName={agent.name} current="context" />
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>

      <ContextManager
        agentId={agent.id}
        isPro={subscription?.plan === "pro"}
        initialSources={sources.map((source) => ({
          id: source.id,
          filename: source.filename,
          mimeType: source.mimeType,
          sizeBytes: source.sizeBytes,
          chunkCount: source.chunkCount,
          createdAt: source.createdAt.toISOString(),
        }))}
        initialLimits={{
          maxBytes: MAX_CONTEXT_FILE_BYTES,
          used,
          limit,
          remaining: limit === null ? null : Math.max(limit - used, 0),
          allowedMimeTypes: listAllowedMimeTypes(),
        }}
      />
    </div>
  );
}

export default function AgentContextPage({ params }: ContextPageProps) {
  return (
    <Suspense fallback={<ContextFallback />}>
      <ContextContent params={params} />
    </Suspense>
  );
}
