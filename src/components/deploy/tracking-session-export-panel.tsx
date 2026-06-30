"use client";

import { RefreshCw, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ExportStats = {
  total: number;
  exported: number;
  failed: number;
  skipped: number;
  pending: number;
  failedExports?: Array<{
    sessionId?: string;
    error: string | null;
    failedAt: string;
  }>;
};

type TrackingSessionExportPanelProps = {
  agentId: string;
  crmConnected: boolean;
  sessionMappingReady: boolean;
  initialStats: ExportStats | null;
};

export function TrackingSessionExportPanel({
  agentId,
  crmConnected,
  sessionMappingReady,
  initialStats,
}: TrackingSessionExportPanelProps) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [exporting, setExporting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!crmConnected) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/integrations/sales-crm/field-mapping?agentId=${agentId}`,
      );
      const data = (await response.json()) as {
        sessionExportStats?: ExportStats | null;
        session?: { ready?: boolean };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load export stats");
      }

      setStats(data.sessionExportStats ?? null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load export stats",
      );
    } finally {
      setLoading(false);
    }
  }, [agentId, crmConnected]);

  useEffect(() => {
    if (crmConnected) {
      void loadStats();
    }
  }, [crmConnected, loadStats]);

  async function exportSessions() {
    setExporting(true);

    try {
      const response = await fetch(
        `/api/integrations/sales-crm/export?agentId=${agentId}&leadSource=session`,
        { method: "POST" },
      );
      const data = (await response.json()) as {
        imported?: number;
        skipped?: number;
        failed?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Export failed");
      }

      const imported = data.imported ?? 0;
      const skipped = data.skipped ?? 0;
      const failed = data.failed ?? 0;

      if (failed > 0 && imported === 0 && skipped === 0) {
        toast.error(
          `Export failed for ${failed} session${failed === 1 ? "" : "s"}.`,
        );
      } else if (failed > 0) {
        toast.warning(
          `Export complete: ${imported} imported, ${skipped} skipped, ${failed} failed`,
        );
      } else {
        toast.success(
          `Export complete: ${imported} imported, ${skipped} skipped`,
        );
      }

      await loadStats();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function retryFailedExports() {
    setRetrying(true);

    try {
      const response = await fetch(
        `/api/integrations/sales-crm/retry?agentId=${agentId}&leadSource=session`,
        { method: "POST" },
      );
      const data = (await response.json()) as {
        imported?: number;
        skipped?: number;
        failed?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Retry failed");
      }

      toast.success(
        `Retry complete: ${data.imported ?? 0} imported, ${data.skipped ?? 0} skipped, ${data.failed ?? 0} still failed`,
      );

      await loadStats();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Export sessions to Sales CRM</h2>
        <p className="text-sm text-muted-foreground">
          Tracking sessions are exported manually. Connect Sales CRM and map
          session fields on the{" "}
          <Link
            href={`/agents/${agentId}/forms`}
            className="font-medium underline"
          >
            Forms
          </Link>{" "}
          page before exporting.
        </p>
      </div>

      {!crmConnected ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          Sales CRM is not connected.{" "}
          <Link
            href={`/agents/${agentId}/forms`}
            className="font-medium text-foreground underline"
          >
            Connect on the Forms page
          </Link>{" "}
          to export sessions.
        </p>
      ) : (
        <>
          {stats ? (
            <p className="text-sm text-muted-foreground">
              {stats.exported} of {stats.total} exported
              {stats.pending > 0 ? ` · ${stats.pending} pending` : ""}
              {stats.failed > 0 ? ` · ${stats.failed} failed` : ""}
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">
              Loading export stats…
            </p>
          ) : null}

          {stats?.failedExports && stats.failedExports.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
              <p className="font-medium text-destructive">
                Recent export errors
              </p>
              <ul className="space-y-1 text-destructive/90">
                {stats.failedExports.map((entry) => (
                  <li key={entry.sessionId}>
                    {entry.error ?? "Unknown error"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void exportSessions()}
              disabled={
                exporting || retrying || loading || !sessionMappingReady
              }
            >
              <Upload />
              {exporting ? "Exporting…" : "Export all sessions"}
            </Button>

            {stats && stats.failed > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void retryFailedExports()}
                disabled={
                  exporting || retrying || loading || !sessionMappingReady
                }
              >
                <RefreshCw />
                {retrying ? "Retrying…" : `Retry failed (${stats.failed})`}
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadStats()}
              disabled={loading || exporting || retrying}
            >
              Refresh stats
            </Button>
          </div>

          {!sessionMappingReady ? (
            <p className="text-sm text-muted-foreground">
              Save session field mapping on the{" "}
              <Link
                href={`/agents/${agentId}/forms`}
                className="font-medium underline"
              >
                Forms
              </Link>{" "}
              page before exporting.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
