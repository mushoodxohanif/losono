import { createExternalFormSubmission } from "@/lib/db/queries/external-form-submissions";
import {
  getExternalFormById,
  getExternalFormBySlug,
} from "@/lib/db/queries/external-forms";
import { syncNewExternalSubmission } from "@/lib/integrations/sales-crm/sync";
import { buildPreChatResponseSchema } from "@/lib/pre-chat-form";

function normalizeResponses(responses: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(responses).map(([key, value]) => [key, value.trim()]),
  );
}

function queueExternalSubmissionSync(agentId: string, submissionId: string) {
  void syncNewExternalSubmission(agentId, submissionId).catch((error) => {
    console.error("Sales CRM external form sync hook failed:", error);
  });
}

export async function submitFreeformExternalForm(input: {
  agentId: string;
  visitorId: string;
  responses: Record<string, string>;
  pageUrl?: string | null;
  formName?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const metadata: Record<string, unknown> = { ...(input.metadata ?? {}) };
  if (input.formName?.trim()) {
    metadata.formName = input.formName.trim();
  }

  const submission = await createExternalFormSubmission({
    agentId: input.agentId,
    formId: null,
    visitorId: input.visitorId,
    responses: normalizeResponses(input.responses),
    pageUrl: input.pageUrl ?? null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  });

  queueExternalSubmissionSync(input.agentId, submission.id);

  return submission;
}

export async function submitRegisteredExternalForm(input: {
  agentId: string;
  formRef: string;
  visitorId: string;
  responses: Record<string, string>;
  pageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const form =
    (await getExternalFormById(input.agentId, input.formRef)) ??
    (await getExternalFormBySlug(input.agentId, input.formRef));

  if (!form) {
    return { error: "form_not_found" as const };
  }

  const schema = buildPreChatResponseSchema({
    enabled: true,
    fields: form.fields,
  });
  const parsed = schema.safeParse(input.responses);

  if (!parsed.success) {
    return {
      error: "validation_failed" as const,
      details: parsed.error.flatten().fieldErrors,
    };
  }

  const normalizedResponses = Object.fromEntries(
    form.fields.map((field) => [
      field.id,
      (parsed.data[field.id] ?? "").trim(),
    ]),
  );

  const submission = await createExternalFormSubmission({
    agentId: input.agentId,
    formId: form.id,
    visitorId: input.visitorId,
    responses: normalizedResponses,
    pageUrl: input.pageUrl ?? null,
    metadata: input.metadata ?? null,
  });

  queueExternalSubmissionSync(input.agentId, submission.id);

  return { submission, form };
}
