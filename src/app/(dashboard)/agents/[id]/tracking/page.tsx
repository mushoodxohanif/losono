import { notFound } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { TrackingLogs } from "@/components/deploy/tracking-logs";
import { TrackingSessionExportPanel } from "@/components/deploy/tracking-session-export-panel";
import { TrackingSettings } from "@/components/deploy/tracking-settings";
import { getAppUrl } from "@/lib/app-url";
import { getAgentForUser } from "@/lib/db/queries/agents";
import { getExportStatusForLeadSourceIds } from "@/lib/db/queries/crm-export-log";
import { getCrmFieldMappingForAgent } from "@/lib/db/queries/crm-field-mappings";
import {
  getCrmIntegrationForUser,
  isCrmIntegrationConnected,
} from "@/lib/db/queries/crm-integrations";
import { listTrackingEventsForAgent } from "@/lib/db/queries/tracking-events";
import { listTrackingSessionsForAgent } from "@/lib/db/queries/tracking-sessions";
import { isSessionMappingReady } from "@/lib/integrations/sales-crm/field-mapping";
import { getExportSummaryForAgent } from "@/lib/integrations/sales-crm/sync";

type TrackingPageProps = {
  params: Promise<{ id: string }>;
};

function TrackingFallback() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
    </div>
  );
}

async function TrackingContent({ params }: TrackingPageProps) {
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

  const [trackingSessions, trackingEvents, crmIntegration] = await Promise.all([
    listTrackingSessionsForAgent(agent.id),
    listTrackingEventsForAgent(agent.id, { limit: 200 }),
    getCrmIntegrationForUser(userId),
  ]);

  const crmConnected =
    crmIntegration !== null && isCrmIntegrationConnected(crmIntegration);

  const exportStatusBySessionId =
    crmConnected && crmIntegration
      ? await getExportStatusForLeadSourceIds(
          agent.id,
          crmIntegration.id,
          "session",
          trackingSessions.map((item) => item.id),
        )
      : new Map();

  let sessionMappingReady = false;
  let sessionExportStats = null;

  if (crmConnected && crmIntegration) {
    const [mappingRow, exportSummary] = await Promise.all([
      getCrmFieldMappingForAgent(crmIntegration.id, agent.id),
      getExportSummaryForAgent(userId, agent.id),
    ]);

    sessionMappingReady = isSessionMappingReady(mappingRow?.mapping ?? {});
    sessionExportStats = exportSummary?.session ?? null;
  }

  const allowedOrigins = agent.settings.allowedOrigins ?? [];
  const appUrl = getAppUrl();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6 md:p-8">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Agent</p>
        <h1 className="text-3xl font-semibold tracking-tight">{agent.name}</h1>
        <p className="text-muted-foreground">
          Tracking · Click events and session analytics from your website
        </p>
      </div>

      <TrackingSettings
        agentId={agent.id}
        agentSlug={agent.slug}
        appUrl={appUrl}
        published={agent.status === "published"}
        allowedOriginsConfigured={allowedOrigins.length > 0}
      />

      <TrackingSessionExportPanel
        agentId={agent.id}
        crmConnected={crmConnected}
        sessionMappingReady={sessionMappingReady}
        initialStats={sessionExportStats}
      />

      <TrackingLogs
        agentId={agent.id}
        initialSessions={trackingSessions.map((item) => ({
          id: item.id,
          visitorId: item.visitorId,
          startedAt: item.startedAt,
          lastActivityAt: item.lastActivityAt,
          landingPage: item.landingPage,
          referrer: item.referrer,
          eventCount: item.eventCount,
          summary: item.summary,
          exportStatus: exportStatusBySessionId.get(item.id) ?? null,
        }))}
        initialEvents={trackingEvents.map((event) => ({
          id: event.id,
          sessionId: event.sessionId,
          visitorId: event.visitorId,
          eventName: event.eventName,
          properties: event.properties,
          pageUrl: event.pageUrl,
          createdAt: event.createdAt,
        }))}
      />
    </div>
  );
}

export default function TrackingPage({ params }: TrackingPageProps) {
  return (
    <Suspense fallback={<TrackingFallback />}>
      <TrackingContent params={params} />
    </Suspense>
  );
}
