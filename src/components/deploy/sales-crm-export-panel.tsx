"use client";

import { Link2, Link2Off, RefreshCw, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  externalFormFieldKey,
  FREEFORM_CRM_FIELD_KEYS,
  freeformFieldKey,
  SESSION_CRM_FIELD_KEYS,
  sessionFieldKey,
} from "@/lib/integrations/sales-crm/field-mapping";
import type {
  SalesCrmCampaign,
  SalesCrmField,
} from "@/lib/integrations/sales-crm/types";
import type { PreChatField } from "@/lib/pre-chat-form";

type IntegrationSummary = {
  id: string;
  provider: string;
  salesCrmBaseUrl: string | null;
  campaignId: string | null;
  campaignName: string | null;
  syncEnabled: boolean;
  connected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
};

type ExportStats = {
  total: number;
  exported: number;
  failed: number;
  skipped: number;
  pending: number;
  failedExports?: Array<{
    submissionId?: string;
    sessionId?: string;
    error: string | null;
    failedAt: string;
  }>;
};

type SessionFieldKey = (typeof SESSION_CRM_FIELD_KEYS)[number];

const SESSION_FIELD_LABELS: Record<SessionFieldKey, string> = {
  visitor_id: "Visitor ID",
  landing_page: "Landing page",
  event_count: "Event count",
  events_summary: "Events summary",
  last_event: "Last event",
  referrer: "Referrer",
};

type ExternalFormMappingSummary = {
  id: string;
  name: string;
  slug: string;
  fields: PreChatField[];
  suggestedMapping?: Record<string, string>;
  ready?: boolean;
};

type MappingTab = "pre_chat" | "external" | "freeform" | "sessions";

type SalesCrmExportPanelProps = {
  agentId: string;
  preChatFields: PreChatField[];
  externalForms: ExternalFormMappingSummary[];
  platformReady: boolean;
  defaultSalesCrmUrl: string | null;
  initialSalesCrmUrl: string;
  initialConnected: boolean;
  initialIntegration: IntegrationSummary | null;
  initialCampaigns: SalesCrmCampaign[];
  crmStatus?: string;
  crmError?: string;
};

const NONE_VALUE = "__none__";

export function SalesCrmExportPanel({
  agentId,
  preChatFields,
  externalForms: initialExternalForms,
  platformReady,
  defaultSalesCrmUrl,
  initialSalesCrmUrl,
  initialConnected,
  initialIntegration,
  initialCampaigns,
  crmStatus,
  crmError,
}: SalesCrmExportPanelProps) {
  const router = useRouter();
  const [connected, setConnected] = useState(initialConnected);
  const [integration, setIntegration] = useState(initialIntegration);
  const [salesCrmUrl, setSalesCrmUrl] = useState(initialSalesCrmUrl);
  const [savingUrl, setSavingUrl] = useState(false);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    initialIntegration?.campaignId ?? "",
  );
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingReady, setMappingReady] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [crmFields, setCrmFields] = useState<SalesCrmField[]>([]);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  const [externalExportStats, setExternalExportStats] =
    useState<ExportStats | null>(null);
  const [sessionExportStats, setSessionExportStats] =
    useState<ExportStats | null>(null);
  const [externalForms, setExternalForms] = useState(initialExternalForms);
  const [freeformReady, setFreeformReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [mappingTab, setMappingTab] = useState<MappingTab>("pre_chat");
  const [selectedExternalFormId, setSelectedExternalFormId] = useState(
    initialExternalForms[0]?.id ?? "",
  );
  const [savingMapping, setSavingMapping] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingExternal, setExportingExternal] = useState(false);
  const [exportingSessions, setExportingSessions] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryingExternal, setRetryingExternal] = useState(false);
  const [retryingSessions, setRetryingSessions] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (crmStatus === "connected") {
      toast.success("Connected to Sales CRM");
      router.replace(`/agents/${agentId}/forms`, { scroll: false });
    }
  }, [crmStatus, agentId, router]);

  const loadFieldMapping = useCallback(async () => {
    if (!integration?.campaignId) {
      return;
    }

    setMappingLoading(true);

    try {
      const response = await fetch(
        `/api/integrations/sales-crm/field-mapping?agentId=${agentId}`,
      );
      const data = (await response.json()) as {
        mapping?: Record<string, string>;
        crmFields?: SalesCrmField[];
        ready?: boolean;
        exportStats?: ExportStats;
        externalExportStats?: ExportStats;
        sessionExportStats?: ExportStats;
        externalForms?: ExternalFormMappingSummary[];
        freeform?: {
          keys?: string[];
          ready?: boolean;
        };
        session?: {
          keys?: string[];
          ready?: boolean;
        };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load field mapping");
      }

      setFieldMapping(data.mapping ?? {});
      setCrmFields(data.crmFields ?? []);
      setMappingReady(Boolean(data.ready));
      setExportStats(data.exportStats ?? null);
      setExternalExportStats(data.externalExportStats ?? null);
      setSessionExportStats(data.sessionExportStats ?? null);
      setExternalForms(data.externalForms ?? initialExternalForms);
      setFreeformReady(Boolean(data.freeform?.ready));
      setSessionReady(Boolean(data.session?.ready));

      if (
        data.externalForms?.length &&
        !data.externalForms.some((form) => form.id === selectedExternalFormId)
      ) {
        setSelectedExternalFormId(data.externalForms[0]?.id ?? "");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load field mapping",
      );
    } finally {
      setMappingLoading(false);
    }
  }, [
    agentId,
    integration?.campaignId,
    initialExternalForms,
    selectedExternalFormId,
  ]);

  useEffect(() => {
    if (connected && integration?.campaignId) {
      void loadFieldMapping();
    }
  }, [connected, integration?.campaignId, loadFieldMapping]);

  async function refreshIntegration() {
    const response = await fetch("/api/integrations/sales-crm");
    const data = (await response.json()) as {
      connected?: boolean;
      integration?: IntegrationSummary | null;
      campaigns?: SalesCrmCampaign[];
      campaignsError?: string;
    };

    setConnected(Boolean(data.connected));
    setIntegration(data.integration ?? null);
    setCampaigns(data.campaigns ?? []);
    setCampaignsError(data.campaignsError ?? null);
    setSelectedCampaignId(data.integration?.campaignId ?? "");
  }

  async function saveCampaign() {
    if (!selectedCampaignId) {
      toast.error("Select a campaign");
      return;
    }

    setSavingCampaign(true);

    try {
      const response = await fetch("/api/integrations/sales-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: selectedCampaignId }),
      });
      const data = (await response.json()) as {
        integration?: IntegrationSummary;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save campaign");
      }

      setIntegration(data.integration ?? null);
      toast.success("Campaign saved");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save campaign",
      );
    } finally {
      setSavingCampaign(false);
    }
  }

  async function applySuggestedMapping() {
    setMappingLoading(true);

    try {
      const response = await fetch(
        `/api/integrations/sales-crm/field-mapping?agentId=${agentId}`,
      );
      const data = (await response.json()) as {
        suggestedMapping?: Record<string, string>;
        externalForms?: ExternalFormMappingSummary[];
        freeform?: { suggestedMapping?: Record<string, string> };
        session?: { suggestedMapping?: Record<string, string> };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load suggestions");
      }

      if (mappingTab === "pre_chat") {
        setFieldMapping((current) => ({
          ...current,
          ...(data.suggestedMapping ?? {}),
        }));
      } else if (mappingTab === "external") {
        const selectedForm = data.externalForms?.find(
          (form) => form.id === selectedExternalFormId,
        );
        if (selectedForm?.suggestedMapping) {
          setFieldMapping((current) => ({
            ...current,
            ...selectedForm.suggestedMapping,
          }));
        }
      } else if (mappingTab === "freeform") {
        setFieldMapping((current) => ({
          ...current,
          ...(data.freeform?.suggestedMapping ?? {}),
        }));
      } else if (mappingTab === "sessions") {
        setFieldMapping((current) => ({
          ...current,
          ...(data.session?.suggestedMapping ?? {}),
        }));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load suggestions",
      );
    } finally {
      setMappingLoading(false);
    }
  }

  async function saveMapping() {
    setSavingMapping(true);

    try {
      const response = await fetch(
        `/api/integrations/sales-crm/field-mapping?agentId=${agentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mapping: fieldMapping }),
        },
      );
      const data = (await response.json()) as {
        ready?: boolean;
        externalForms?: Array<{ id: string; ready?: boolean }>;
        freeformReady?: boolean;
        sessionReady?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save field mapping");
      }

      setMappingReady(Boolean(data.ready));
      setFreeformReady(Boolean(data.freeformReady));
      setSessionReady(Boolean(data.sessionReady));
      if (data.externalForms) {
        setExternalForms((current) =>
          current.map((form) => {
            const updated = data.externalForms?.find(
              (item) => item.id === form.id,
            );
            return updated ? { ...form, ready: updated.ready } : form;
          }),
        );
      }
      toast.success("Field mapping saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save field mapping",
      );
    } finally {
      setSavingMapping(false);
    }
  }

  async function exportAllLeads(
    leadSource: "pre_chat" | "external_form" | "session",
  ) {
    const isExternal = leadSource === "external_form";
    const isSession = leadSource === "session";
    if (isExternal) {
      setExportingExternal(true);
    } else if (isSession) {
      setExportingSessions(true);
    } else {
      setExporting(true);
    }

    try {
      const response = await fetch(
        `/api/integrations/sales-crm/export?agentId=${agentId}&leadSource=${leadSource}`,
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
          `Export failed for ${failed} lead${failed === 1 ? "" : "s"}. See errors below.`,
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

      await Promise.all([loadFieldMapping(), refreshIntegration()]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      if (isExternal) {
        setExportingExternal(false);
      } else if (isSession) {
        setExportingSessions(false);
      } else {
        setExporting(false);
      }
    }
  }

  async function retryFailedExports(
    leadSource: "pre_chat" | "external_form" | "session",
  ) {
    const isExternal = leadSource === "external_form";
    const isSession = leadSource === "session";
    if (isExternal) {
      setRetryingExternal(true);
    } else if (isSession) {
      setRetryingSessions(true);
    } else {
      setRetrying(true);
    }

    try {
      const response = await fetch(
        `/api/integrations/sales-crm/retry?agentId=${agentId}&leadSource=${leadSource}`,
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

      await Promise.all([loadFieldMapping(), refreshIntegration()]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    } finally {
      if (isExternal) {
        setRetryingExternal(false);
      } else if (isSession) {
        setRetryingSessions(false);
      } else {
        setRetrying(false);
      }
    }
  }

  async function disconnect() {
    setDisconnecting(true);

    try {
      const response = await fetch("/api/integrations/sales-crm", {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Failed to disconnect");
        return;
      }

      setConnected(false);
      setIntegration(null);
      setCampaigns([]);
      setFieldMapping({});
      setCrmFields([]);
      setExportStats(null);
      setExternalExportStats(null);
      setSessionExportStats(null);
      setMappingReady(false);
      setSessionReady(false);
      setDisconnectOpen(false);
      toast.success("Disconnected from Sales CRM");
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  function updateFieldMapping(fieldId: string, crmKey: string) {
    setFieldMapping((current) => {
      const next = { ...current };

      if (crmKey === NONE_VALUE) {
        delete next[fieldId];
      } else {
        next[fieldId] = crmKey;
      }

      return next;
    });
  }

  async function saveSalesCrmUrl() {
    if (!salesCrmUrl.trim()) {
      toast.error("Enter your Sales CRM URL");
      return;
    }

    setSavingUrl(true);

    try {
      const response = await fetch("/api/integrations/sales-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesCrmBaseUrl: salesCrmUrl }),
      });
      const data = (await response.json()) as {
        integration?: IntegrationSummary;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save Sales CRM URL");
      }

      setIntegration(data.integration ?? null);
      toast.success("Sales CRM URL saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save Sales CRM URL",
      );
    } finally {
      setSavingUrl(false);
    }
  }

  function getConnectHref(): string {
    const params = new URLSearchParams({ agentId });
    const url = salesCrmUrl.trim() || defaultSalesCrmUrl || "";

    if (url) {
      params.set("salesCrmBaseUrl", url);
    }

    return `/api/integrations/sales-crm/connect?${params.toString()}`;
  }

  const canConnect =
    platformReady && Boolean(salesCrmUrl.trim() || defaultSalesCrmUrl);

  const selectedExternalForm = externalForms.find(
    (form) => form.id === selectedExternalFormId,
  );
  const selectedExternalFormReady = Boolean(selectedExternalForm?.ready);

  function renderMappingTable(
    rows: Array<{
      key: string;
      label: string;
      description?: string;
    }>,
  ) {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Losono field</th>
              <th className="px-4 py-2 font-medium">Sales CRM field</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium">{row.label}</p>
                  {row.description ? (
                    <p className="text-muted-foreground capitalize">
                      {row.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={fieldMapping[row.key] ?? NONE_VALUE}
                    onValueChange={(value) =>
                      updateFieldMapping(row.key, value)
                    }
                    disabled={mappingLoading}
                  >
                    <SelectTrigger className="w-full min-w-[200px]">
                      <SelectValue placeholder="Not mapped" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Not mapped</SelectItem>
                      {crmFields.map((crmField) => (
                        <SelectItem key={crmField.key} value={crmField.key}>
                          {crmField.label} ({crmField.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderExportSection(input: {
    title: string;
    description: string;
    stats: ExportStats | null;
    ready: boolean;
    canExport: boolean;
    exportingState: boolean;
    retryingState: boolean;
    leadSource: "pre_chat" | "external_form" | "session";
  }) {
    return (
      <div className="space-y-3 border-t border-border pt-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{input.title}</p>
          <p className="text-sm text-muted-foreground">{input.description}</p>
        </div>

        {input.stats ? (
          <p className="text-sm text-muted-foreground">
            {input.stats.exported} of {input.stats.total} exported
            {input.stats.pending > 0 ? ` · ${input.stats.pending} pending` : ""}
            {input.stats.failed > 0 ? ` · ${input.stats.failed} failed` : ""}
          </p>
        ) : null}

        {input.stats?.failedExports && input.stats.failedExports.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            <p className="font-medium text-destructive">Recent export errors</p>
            <ul className="space-y-1 text-destructive/90">
              {input.stats.failedExports.map((entry) => (
                <li key={entry.submissionId ?? entry.sessionId}>
                  {entry.error ?? "Unknown error"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void exportAllLeads(input.leadSource)}
            disabled={
              input.exportingState ||
              input.retryingState ||
              mappingLoading ||
              !input.ready ||
              !input.canExport
            }
          >
            <Upload />
            {input.exportingState ? "Exporting…" : "Export all leads"}
          </Button>

          {input.stats && input.stats.failed > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void retryFailedExports(input.leadSource)}
              disabled={
                input.exportingState ||
                input.retryingState ||
                mappingLoading ||
                !input.ready ||
                !input.canExport
              }
            >
              <RefreshCw />
              {input.retryingState
                ? "Retrying…"
                : `Retry failed (${input.stats.failed})`}
            </Button>
          ) : null}
        </div>

        {!input.ready && input.canExport ? (
          <p className="text-sm text-muted-foreground">
            Save field mapping before exporting.
          </p>
        ) : null}
      </div>
    );
  }

  if (!platformReady) {
    return (
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Sales CRM export</h2>
          <p className="text-sm text-muted-foreground">
            Sales CRM export is temporarily unavailable. Contact your Losono
            administrator.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Sales CRM export</h2>
          <p className="text-sm text-muted-foreground">
            Connect Sales CRM to export pre-chat, external form, and tracking
            session leads into a campaign. Pre-chat and external form
            submissions sync automatically when mapping is complete. Tracking
            sessions are exported manually.
          </p>
        </div>

        {connected && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDisconnectOpen(true)}
          >
            <Link2Off />
            Disconnect
          </Button>
        )}
      </div>

      {crmError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Connection failed: {crmError}
        </p>
      )}

      {!connected ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Sales CRM URL</p>
            <p className="text-sm text-muted-foreground">
              Enter the URL where your team signs in to Sales CRM, then connect
              your account.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <Input
                value={salesCrmUrl}
                onChange={(event) => setSalesCrmUrl(event.target.value)}
                placeholder={
                  defaultSalesCrmUrl ?? "https://crm.yourcompany.com"
                }
                className="min-w-[240px] flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={savingUrl}
                onClick={() => void saveSalesCrmUrl()}
              >
                {savingUrl ? "Saving…" : "Save URL"}
              </Button>
            </div>
            {defaultSalesCrmUrl ? (
              <p className="text-xs text-muted-foreground">
                Your workspace default is {defaultSalesCrmUrl}.
              </p>
            ) : null}
          </div>

          <Button asChild disabled={!canConnect}>
            <a href={getConnectHref()}>
              <Link2 />
              Connect to Sales CRM
            </a>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <p className="font-medium">Connection status</p>
            <p className="mt-1 text-muted-foreground">
              {integration?.salesCrmBaseUrl
                ? `${integration.salesCrmBaseUrl} · `
                : ""}
              Connected since{" "}
              {integration?.connectedAt
                ? new Date(integration.connectedAt).toLocaleString()
                : "—"}
              {integration?.lastSyncAt
                ? ` · Last export ${new Date(integration.lastSyncAt).toLocaleString()}`
                : ""}
            </p>
            {integration?.lastError && (
              <p className="mt-2 text-destructive">{integration.lastError}</p>
            )}
            {campaignsError && (
              <p className="mt-2 text-destructive">{campaignsError}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Target campaign</p>
              <p className="text-sm text-muted-foreground">
                Choose the Sales CRM campaign where leads from this account
                should be created.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Select
                value={selectedCampaignId || undefined}
                onValueChange={setSelectedCampaignId}
              >
                <SelectTrigger className="min-w-[240px] flex-1">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                      {campaign.campaignType?.name
                        ? ` · ${campaign.campaignType.name}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={saveCampaign}
                disabled={savingCampaign || !selectedCampaignId}
              >
                Save campaign
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void refreshIntegration()}
                aria-label="Refresh campaigns"
              >
                <RefreshCw />
              </Button>
            </div>
          </div>

          {integration?.campaignId && (
            <>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Field mapping</p>
                    <p className="text-sm text-muted-foreground">
                      Map Losono fields to Sales CRM campaign fields for{" "}
                      <span className="font-medium">
                        {integration.campaignName ?? "selected campaign"}
                      </span>
                      .
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void applySuggestedMapping()}
                    disabled={mappingLoading}
                  >
                    Auto-suggest
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["pre_chat", "Pre-chat"],
                      ["external", "External forms"],
                      ["freeform", "Freeform"],
                      ["sessions", "Sessions"],
                    ] as const
                  ).map(([tab, label]) => (
                    <Button
                      key={tab}
                      type="button"
                      size="sm"
                      variant={mappingTab === tab ? "default" : "outline"}
                      onClick={() => setMappingTab(tab)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {mappingTab === "pre_chat" ? (
                  preChatFields.length === 0 ? (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
                      Add pre-chat form fields above before mapping exports.
                    </p>
                  ) : (
                    renderMappingTable(
                      preChatFields.map((field) => ({
                        key: field.id,
                        label: field.label,
                        description: `${field.type}${field.required ? " · required" : ""}`,
                      })),
                    )
                  )
                ) : null}

                {mappingTab === "external" ? (
                  externalForms.length === 0 ? (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
                      Create external forms below before mapping exports.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <Select
                        value={selectedExternalFormId || undefined}
                        onValueChange={setSelectedExternalFormId}
                      >
                        <SelectTrigger className="min-w-[240px]">
                          <SelectValue placeholder="Select a form" />
                        </SelectTrigger>
                        <SelectContent>
                          {externalForms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.name} ({form.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedExternalForm ? (
                        selectedExternalForm.fields.length === 0 ? (
                          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
                            Add fields to this form before mapping exports.
                          </p>
                        ) : (
                          renderMappingTable(
                            selectedExternalForm.fields.map((field) => ({
                              key: externalFormFieldKey(
                                selectedExternalForm.id,
                                field.id,
                              ),
                              label: field.label,
                              description: `${field.type}${field.required ? " · required" : ""}`,
                            })),
                          )
                        )
                      ) : null}
                    </div>
                  )
                ) : null}

                {mappingTab === "freeform"
                  ? renderMappingTable(
                      FREEFORM_CRM_FIELD_KEYS.map((key) => ({
                        key: freeformFieldKey(key),
                        label: key.charAt(0).toUpperCase() + key.slice(1),
                        description: "Freeform response key",
                      })),
                    )
                  : null}

                {mappingTab === "sessions"
                  ? renderMappingTable(
                      SESSION_CRM_FIELD_KEYS.map((key) => ({
                        key: sessionFieldKey(key),
                        label: SESSION_FIELD_LABELS[key],
                        description: "Tracking session field",
                      })),
                    )
                  : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void saveMapping()}
                    disabled={savingMapping || mappingLoading}
                  >
                    Save mapping
                  </Button>
                </div>
              </div>

              {mappingTab === "pre_chat"
                ? renderExportSection({
                    title: "Pre-chat bulk export",
                    description:
                      "Export existing pre-chat submissions that have not been synced yet.",
                    stats: exportStats,
                    ready: mappingReady,
                    canExport: preChatFields.length > 0,
                    exportingState: exporting,
                    retryingState: retrying,
                    leadSource: "pre_chat",
                  })
                : null}

              {mappingTab === "external" || mappingTab === "freeform"
                ? renderExportSection({
                    title: "External form bulk export",
                    description:
                      "Export existing external form submissions that have not been synced yet.",
                    stats: externalExportStats,
                    ready:
                      mappingTab === "external"
                        ? selectedExternalFormReady || freeformReady
                        : freeformReady,
                    canExport:
                      mappingTab === "external"
                        ? externalForms.length > 0
                        : true,
                    exportingState: exportingExternal,
                    retryingState: retryingExternal,
                    leadSource: "external_form",
                  })
                : null}

              {mappingTab === "sessions"
                ? renderExportSection({
                    title: "Tracking session export",
                    description:
                      "Manually export tracking sessions that have not been sent to Sales CRM yet.",
                    stats: sessionExportStats,
                    ready: sessionReady,
                    canExport: true,
                    exportingState: exportingSessions,
                    retryingState: retryingSessions,
                    leadSource: "session",
                  })
                : null}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Disconnect Sales CRM?"
        description="Auto-sync will stop and you'll need to reconnect to export leads again."
        confirmLabel={disconnecting ? "Disconnecting…" : "Disconnect"}
        onConfirm={disconnect}
        loading={disconnecting}
      />
    </section>
  );
}
