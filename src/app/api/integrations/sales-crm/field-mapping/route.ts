import { auth } from "@/auth";
import { getAgentForUser } from "@/lib/db/queries/agents";
import {
  getCrmFieldMappingForAgent,
  upsertCrmFieldMapping,
} from "@/lib/db/queries/crm-field-mappings";
import { getCrmIntegrationForUser } from "@/lib/db/queries/crm-integrations";
import { listExternalFormsForAgent } from "@/lib/db/queries/external-forms";
import { getSalesCrmCampaignFields } from "@/lib/integrations/sales-crm/client";
import { SalesCrmError } from "@/lib/integrations/sales-crm/errors";
import {
  FREEFORM_CRM_FIELD_KEYS,
  isExternalFormMappingReady,
  isFieldMappingReady,
  isFreeformMappingReady,
  isSessionMappingReady,
  SESSION_CRM_FIELD_KEYS,
  suggestExternalFormMapping,
  suggestFieldMapping,
  suggestFreeformMapping,
  suggestSessionMapping,
} from "@/lib/integrations/sales-crm/field-mapping";
import { getExportSummaryForAgent } from "@/lib/integrations/sales-crm/sync";
import { isTokenEncryptionAvailable } from "@/lib/integrations/token-encryption";
import { resolvePreChatForm } from "@/lib/pre-chat-form";

async function requireAgentAccess(agentId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      error: Response.json({ error: "unauthorized" }, { status: 401 }),
    } as const;
  }

  const agent = await getAgentForUser(agentId, userId);

  if (!agent) {
    return {
      error: Response.json({ error: "agent_not_found" }, { status: 404 }),
    } as const;
  }

  return { userId, agent } as const;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agentId = url.searchParams.get("agentId");

  if (!agentId) {
    return Response.json({ error: "agent_id_required" }, { status: 400 });
  }

  const access = await requireAgentAccess(agentId);

  if ("error" in access) {
    return access.error;
  }

  if (!isTokenEncryptionAvailable()) {
    return Response.json(
      { error: "sales_crm_not_configured" },
      { status: 503 },
    );
  }

  const integration = await getCrmIntegrationForUser(access.userId);

  if (!integration) {
    return Response.json({ error: "not_connected" }, { status: 409 });
  }

  if (!integration.campaignId) {
    return Response.json({ error: "campaign_required" }, { status: 409 });
  }

  const preChatForm = resolvePreChatForm(access.agent.settings.preChatForm);
  const mappingRow = await getCrmFieldMappingForAgent(integration.id, agentId);
  const externalForms = await listExternalFormsForAgent(agentId);

  try {
    const crmFields = await getSalesCrmCampaignFields(
      access.userId,
      integration.campaignId,
    );
    const mapping = mappingRow?.mapping ?? {};
    const suggestedMapping = suggestFieldMapping(preChatForm.fields, crmFields);
    const exportSummary = await getExportSummaryForAgent(
      access.userId,
      agentId,
    );

    return Response.json({
      mapping,
      suggestedMapping,
      crmFields,
      ready: isFieldMappingReady(preChatForm.fields, mapping),
      exportStats: exportSummary?.preChat ?? null,
      externalForms: externalForms.map((form) => ({
        id: form.id,
        name: form.name,
        slug: form.slug,
        fields: form.fields,
        suggestedMapping: suggestExternalFormMapping(
          form.id,
          form.fields,
          crmFields,
        ),
        ready: isExternalFormMappingReady(form.fields, mapping, form.id),
      })),
      freeform: {
        keys: FREEFORM_CRM_FIELD_KEYS,
        suggestedMapping: suggestFreeformMapping(crmFields),
        ready: isFreeformMappingReady(mapping),
      },
      session: {
        keys: SESSION_CRM_FIELD_KEYS,
        suggestedMapping: suggestSessionMapping(crmFields),
        ready: isSessionMappingReady(mapping),
      },
      externalExportStats: exportSummary?.externalForm ?? null,
      sessionExportStats: exportSummary?.session ?? null,
    });
  } catch (error) {
    console.error("Failed to load field mapping:", error);

    const message =
      error instanceof SalesCrmError
        ? error.message
        : "Failed to load CRM fields";

    return Response.json({ error: message }, { status: 500 });
  }
}

type UpdateMappingBody = {
  mapping?: Record<string, string>;
};

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const agentId = url.searchParams.get("agentId");

  if (!agentId) {
    return Response.json({ error: "agent_id_required" }, { status: 400 });
  }

  const access = await requireAgentAccess(agentId);

  if ("error" in access) {
    return access.error;
  }

  const integration = await getCrmIntegrationForUser(access.userId);

  if (!integration) {
    return Response.json({ error: "not_connected" }, { status: 409 });
  }

  if (!integration.campaignId) {
    return Response.json({ error: "campaign_required" }, { status: 409 });
  }

  let body: UpdateMappingBody;

  try {
    body = (await request.json()) as UpdateMappingBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.mapping || typeof body.mapping !== "object") {
    return Response.json({ error: "mapping_required" }, { status: 400 });
  }

  const sanitizedMapping = Object.fromEntries(
    Object.entries(body.mapping).filter(
      ([, value]) => typeof value === "string" && value.trim().length > 0,
    ),
  );

  const updated = await upsertCrmFieldMapping({
    integrationId: integration.id,
    agentId,
    mapping: sanitizedMapping,
  });

  const preChatForm = resolvePreChatForm(access.agent.settings.preChatForm);
  const externalForms = await listExternalFormsForAgent(agentId);

  return Response.json({
    mapping: updated.mapping,
    ready: isFieldMappingReady(preChatForm.fields, updated.mapping),
    externalForms: externalForms.map((form) => ({
      id: form.id,
      ready: isExternalFormMappingReady(form.fields, updated.mapping, form.id),
    })),
    freeformReady: isFreeformMappingReady(updated.mapping),
    sessionReady: isSessionMappingReady(updated.mapping),
  });
}
