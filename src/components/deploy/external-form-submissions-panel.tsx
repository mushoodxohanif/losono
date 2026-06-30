"use client";

import type { CrmExportStatus } from "@/lib/db/schema";
import type { PreChatField } from "@/lib/pre-chat-form";

type ExternalFormSummary = {
  id: string;
  name: string;
  slug: string;
  fields: PreChatField[];
};

export type ExternalFormSubmissionView = {
  id: string;
  formId: string | null;
  visitorId: string;
  responses: Record<string, string>;
  pageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string | Date;
  exportStatus?: CrmExportStatus | null;
};

type ExternalFormSubmissionsPanelProps = {
  forms: ExternalFormSummary[];
  submissions: ExternalFormSubmissionView[];
};

function getSubmissionSource(
  submission: ExternalFormSubmissionView,
  formsById: Map<string, ExternalFormSummary>,
) {
  if (submission.formId) {
    const form = formsById.get(submission.formId);
    return form ? `${form.name} (${form.slug})` : "Registered form";
  }

  const formName =
    typeof submission.metadata?.formName === "string"
      ? submission.metadata.formName
      : null;

  return formName ? `Freeform · ${formName}` : "Freeform";
}

function getFieldLabels(
  submission: ExternalFormSubmissionView,
  formsById: Map<string, ExternalFormSummary>,
) {
  if (submission.formId) {
    const form = formsById.get(submission.formId);
    if (form) {
      return new Map(form.fields.map((field) => [field.id, field.label]));
    }
  }

  return new Map(Object.keys(submission.responses).map((key) => [key, key]));
}

function exportStatusLabel(status: CrmExportStatus | null | undefined) {
  switch (status) {
    case "success":
      return "Exported";
    case "skipped":
      return "Skipped";
    case "failed":
      return "Export failed";
    case "pending":
      return "Pending";
    default:
      return "Not exported";
  }
}

export function ExternalFormSubmissionsPanel({
  forms,
  submissions,
}: ExternalFormSubmissionsPanelProps) {
  const formsById = new Map(forms.map((form) => [form.id, form]));

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">External submissions</h2>
        <p className="text-sm text-muted-foreground">
          Responses from website forms captured via track.js or the server-side
          form API. Registered submissions sync to Sales CRM automatically when
          mapping is complete.
        </p>
      </div>

      {submissions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No external submissions yet.
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const fieldLabels = getFieldLabels(submission, formsById);

            return (
              <article
                key={submission.id}
                className="space-y-3 rounded-xl border border-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium">
                      {new Date(submission.createdAt).toLocaleString()}
                    </span>
                    <p className="text-muted-foreground">
                      {getSubmissionSource(submission, formsById)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span>Visitor {submission.visitorId.slice(0, 8)}…</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                      {exportStatusLabel(submission.exportStatus)}
                    </span>
                  </div>
                </div>

                {submission.pageUrl ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {submission.pageUrl}
                  </p>
                ) : null}

                <dl className="grid gap-2 text-sm">
                  {Object.entries(submission.responses).map(
                    ([fieldId, value]) => {
                      if (!value) {
                        return null;
                      }

                      return (
                        <div
                          key={fieldId}
                          className="grid gap-1 rounded-lg bg-muted/40 px-3 py-2"
                        >
                          <dt className="text-muted-foreground">
                            {fieldLabels.get(fieldId) ?? fieldId}
                          </dt>
                          <dd className="whitespace-pre-wrap">{value}</dd>
                        </div>
                      );
                    },
                  )}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
