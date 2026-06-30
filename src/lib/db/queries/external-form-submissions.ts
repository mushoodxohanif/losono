import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { externalFormSubmissions } from "@/lib/db/schema";

export async function createExternalFormSubmission(input: {
  agentId: string;
  formId?: string | null;
  visitorId: string;
  responses: Record<string, string>;
  pageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const [submission] = await getDb()
    .insert(externalFormSubmissions)
    .values({
      agentId: input.agentId,
      formId: input.formId ?? null,
      visitorId: input.visitorId,
      responses: input.responses,
      pageUrl: input.pageUrl ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();

  return submission;
}

export async function listExternalFormSubmissionsForAgent(agentId: string) {
  return getDb()
    .select()
    .from(externalFormSubmissions)
    .where(eq(externalFormSubmissions.agentId, agentId))
    .orderBy(desc(externalFormSubmissions.createdAt));
}

export async function getExternalFormSubmissionById(
  agentId: string,
  submissionId: string,
) {
  const [submission] = await getDb()
    .select()
    .from(externalFormSubmissions)
    .where(
      and(
        eq(externalFormSubmissions.agentId, agentId),
        eq(externalFormSubmissions.id, submissionId),
      ),
    )
    .limit(1);

  return submission ?? null;
}
