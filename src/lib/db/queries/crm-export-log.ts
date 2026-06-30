import { and, count, desc, eq, inArray, notExists } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  type CrmExportStatus,
  type CrmLeadSource,
  crmExportLog,
  externalFormSubmissions,
  formSubmissions,
  trackingSessions,
} from "@/lib/db/schema";

export async function upsertCrmExportLogEntry(input: {
  leadSource: CrmLeadSource;
  leadSourceId: string;
  submissionId?: string | null;
  integrationId: string;
  agentId: string;
  status: CrmExportStatus;
  crmLeadId?: string | null;
  error?: string | null;
}): Promise<void> {
  const now = new Date();
  const exportedAt =
    input.status === "success" || input.status === "skipped" ? now : null;
  const submissionId =
    input.submissionId ??
    (input.leadSource === "pre_chat" ? input.leadSourceId : null);

  await getDb()
    .insert(crmExportLog)
    .values({
      submissionId,
      leadSource: input.leadSource,
      leadSourceId: input.leadSourceId,
      integrationId: input.integrationId,
      agentId: input.agentId,
      status: input.status,
      crmLeadId: input.crmLeadId ?? null,
      error: input.error ?? null,
      exportedAt,
    })
    .onConflictDoUpdate({
      target: [
        crmExportLog.leadSource,
        crmExportLog.leadSourceId,
        crmExportLog.integrationId,
      ],
      set: {
        status: input.status,
        crmLeadId: input.crmLeadId ?? null,
        error: input.error ?? null,
        exportedAt,
        ...(submissionId ? { submissionId } : {}),
      },
    });
}

export async function listUnexportedSubmissionsForAgent(
  agentId: string,
  integrationId: string,
) {
  return getDb()
    .select()
    .from(formSubmissions)
    .where(
      and(
        eq(formSubmissions.agentId, agentId),
        notExists(
          getDb()
            .select({ id: crmExportLog.id })
            .from(crmExportLog)
            .where(
              and(
                eq(crmExportLog.leadSource, "pre_chat"),
                eq(crmExportLog.leadSourceId, formSubmissions.id),
                eq(crmExportLog.integrationId, integrationId),
                eq(crmExportLog.status, "success"),
              ),
            ),
        ),
      ),
    );
}

export async function listFailedSubmissionsForAgent(
  agentId: string,
  integrationId: string,
) {
  return getDb()
    .select({ submissionId: crmExportLog.leadSourceId })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
        eq(crmExportLog.leadSource, "pre_chat"),
        eq(crmExportLog.status, "failed"),
      ),
    );
}

export async function listFailedExportDetailsForAgent(
  agentId: string,
  integrationId: string,
  limit = 10,
) {
  return getDb()
    .select({
      submissionId: crmExportLog.leadSourceId,
      error: crmExportLog.error,
      exportedAt: crmExportLog.exportedAt,
      createdAt: crmExportLog.createdAt,
    })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
        eq(crmExportLog.leadSource, "pre_chat"),
        eq(crmExportLog.status, "failed"),
      ),
    )
    .orderBy(desc(crmExportLog.createdAt))
    .limit(limit);
}

export async function getCrmExportStatsForAgent(
  agentId: string,
  integrationId: string,
) {
  const db = getDb();

  const [totalRow] = await db
    .select({ total: count() })
    .from(formSubmissions)
    .where(eq(formSubmissions.agentId, agentId));

  const statusCounts = await db
    .select({
      status: crmExportLog.status,
      total: count(),
    })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
      ),
    )
    .groupBy(crmExportLog.status);

  const byStatus = Object.fromEntries(
    statusCounts.map((row) => [row.status, row.total]),
  ) as Partial<Record<CrmExportStatus, number>>;

  const exported = byStatus.success ?? 0;
  const failed = byStatus.failed ?? 0;
  const skipped = byStatus.skipped ?? 0;
  const total = totalRow?.total ?? 0;
  const pending = Math.max(total - exported - skipped, 0);

  return { total, exported, failed, skipped, pending };
}

export async function getCrmExportStatsForLeadSource(
  agentId: string,
  integrationId: string,
  leadSource: CrmLeadSource,
) {
  const db = getDb();

  const sourceTable =
    leadSource === "external_form"
      ? externalFormSubmissions
      : leadSource === "pre_chat"
        ? formSubmissions
        : leadSource === "session"
          ? trackingSessions
          : null;

  if (!sourceTable) {
    return { total: 0, exported: 0, failed: 0, skipped: 0, pending: 0 };
  }

  const [totalRow] = await db
    .select({ total: count() })
    .from(sourceTable)
    .where(eq(sourceTable.agentId, agentId));

  const statusCounts = await db
    .select({
      status: crmExportLog.status,
      total: count(),
    })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
        eq(crmExportLog.leadSource, leadSource),
      ),
    )
    .groupBy(crmExportLog.status);

  const byStatus = Object.fromEntries(
    statusCounts.map((row) => [row.status, row.total]),
  ) as Partial<Record<CrmExportStatus, number>>;

  const exported = byStatus.success ?? 0;
  const failed = byStatus.failed ?? 0;
  const skipped = byStatus.skipped ?? 0;
  const total = totalRow?.total ?? 0;
  const pending = Math.max(total - exported - skipped, 0);

  return { total, exported, failed, skipped, pending };
}

export async function listUnexportedExternalSubmissionsForAgent(
  agentId: string,
  integrationId: string,
) {
  return getDb()
    .select()
    .from(externalFormSubmissions)
    .where(
      and(
        eq(externalFormSubmissions.agentId, agentId),
        notExists(
          getDb()
            .select({ id: crmExportLog.id })
            .from(crmExportLog)
            .where(
              and(
                eq(crmExportLog.leadSource, "external_form"),
                eq(crmExportLog.leadSourceId, externalFormSubmissions.id),
                eq(crmExportLog.integrationId, integrationId),
                eq(crmExportLog.status, "success"),
              ),
            ),
        ),
      ),
    );
}

export async function listFailedExternalSubmissionsForAgent(
  agentId: string,
  integrationId: string,
) {
  return getDb()
    .select({ submissionId: crmExportLog.leadSourceId })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
        eq(crmExportLog.leadSource, "external_form"),
        eq(crmExportLog.status, "failed"),
      ),
    );
}

export async function listFailedExternalExportDetailsForAgent(
  agentId: string,
  integrationId: string,
  limit = 10,
) {
  return getDb()
    .select({
      submissionId: crmExportLog.leadSourceId,
      error: crmExportLog.error,
      exportedAt: crmExportLog.exportedAt,
      createdAt: crmExportLog.createdAt,
    })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
        eq(crmExportLog.leadSource, "external_form"),
        eq(crmExportLog.status, "failed"),
      ),
    )
    .orderBy(desc(crmExportLog.createdAt))
    .limit(limit);
}

export async function getExportStatusForLeadSourceIds(
  agentId: string,
  integrationId: string,
  leadSource: CrmLeadSource,
  leadSourceIds: string[],
): Promise<Map<string, CrmExportStatus>> {
  if (leadSourceIds.length === 0) {
    return new Map();
  }

  const rows = await getDb()
    .select({
      leadSourceId: crmExportLog.leadSourceId,
      status: crmExportLog.status,
    })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
        eq(crmExportLog.leadSource, leadSource),
        inArray(crmExportLog.leadSourceId, leadSourceIds),
      ),
    );

  return new Map(rows.map((row) => [row.leadSourceId, row.status]));
}

export async function listUnexportedSessionsForAgent(
  agentId: string,
  integrationId: string,
) {
  return getDb()
    .select()
    .from(trackingSessions)
    .where(
      and(
        eq(trackingSessions.agentId, agentId),
        notExists(
          getDb()
            .select({ id: crmExportLog.id })
            .from(crmExportLog)
            .where(
              and(
                eq(crmExportLog.leadSource, "session"),
                eq(crmExportLog.leadSourceId, trackingSessions.id),
                eq(crmExportLog.integrationId, integrationId),
                eq(crmExportLog.status, "success"),
              ),
            ),
        ),
      ),
    );
}

export async function listFailedSessionsForAgent(
  agentId: string,
  integrationId: string,
) {
  return getDb()
    .select({ sessionId: crmExportLog.leadSourceId })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
        eq(crmExportLog.leadSource, "session"),
        eq(crmExportLog.status, "failed"),
      ),
    );
}

export async function listFailedSessionExportDetailsForAgent(
  agentId: string,
  integrationId: string,
  limit = 10,
) {
  return getDb()
    .select({
      sessionId: crmExportLog.leadSourceId,
      error: crmExportLog.error,
      exportedAt: crmExportLog.exportedAt,
      createdAt: crmExportLog.createdAt,
    })
    .from(crmExportLog)
    .where(
      and(
        eq(crmExportLog.agentId, agentId),
        eq(crmExportLog.integrationId, integrationId),
        eq(crmExportLog.leadSource, "session"),
        eq(crmExportLog.status, "failed"),
      ),
    )
    .orderBy(desc(crmExportLog.createdAt))
    .limit(limit);
}
