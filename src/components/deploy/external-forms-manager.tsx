"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRE_CHAT_FIELD_TYPES, type PreChatField } from "@/lib/pre-chat-form";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens",
    ),
  fields: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1, "Label is required"),
        type: z.enum(PRE_CHAT_FIELD_TYPES),
        required: z.boolean(),
        placeholder: z.string().optional(),
        options: z.string().optional(),
      }),
    )
    .max(12, "Maximum 12 fields allowed"),
});

type FormValues = z.infer<typeof formSchema>;

export type ExternalFormSummary = {
  id: string;
  name: string;
  slug: string;
  fields: PreChatField[];
  createdAt: string | Date;
};

type ExternalFormsManagerProps = {
  agentId: string;
  agentSlug: string;
  appUrl: string;
  initialForms: ExternalFormSummary[];
};

function createFieldId() {
  return crypto.randomUUID();
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function toFormValues(form?: ExternalFormSummary): FormValues {
  if (!form) {
    return {
      name: "",
      slug: "",
      fields: [],
    };
  }

  return {
    name: form.name,
    slug: form.slug,
    fields: form.fields.map((field) => ({
      ...field,
      options: field.options?.join("\n") ?? "",
    })),
  };
}

export function ExternalFormsManager({
  agentId,
  agentSlug,
  appUrl,
  initialForms,
}: ExternalFormsManagerProps) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<ExternalFormSummary | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ExternalFormSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const trackScript = `<script src="${appUrl}/track.js" data-agent="${agentSlug}"></script>`;

  function openCreateDialog() {
    setEditingForm(null);
    form.reset(toFormValues());
    setEditorOpen(true);
  }

  function openEditDialog(target: ExternalFormSummary) {
    setEditingForm(target);
    form.reset(toFormValues(target));
    setEditorOpen(true);
  }

  async function copySnippet(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      fields: values.fields.map((field) => ({
        id: field.id,
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        placeholder: field.placeholder?.trim() || undefined,
        options:
          field.type === "select"
            ? (field.options ?? "")
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
            : undefined,
      })),
    };

    if (
      payload.fields.some(
        (field) => field.type === "select" && !field.options?.length,
      )
    ) {
      toast.error("Select fields need at least one option.");
      return;
    }

    try {
      const response = await fetch(
        editingForm
          ? `/api/agents/${agentId}/forms/${editingForm.id}`
          : `/api/agents/${agentId}/forms`,
        {
          method: editingForm ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as {
        form?: ExternalFormSummary;
        error?: string;
      };

      if (!response.ok) {
        if (data.error === "slug_taken") {
          throw new Error("That slug is already in use for this agent.");
        }

        throw new Error(data.error ?? "Failed to save form");
      }

      if (data.form) {
        const savedForm = data.form;
        setForms((current) => {
          if (editingForm) {
            return current.map((item) =>
              item.id === savedForm.id ? savedForm : item,
            );
          }

          return [savedForm, ...current];
        });
      }

      toast.success(editingForm ? "Form updated" : "Form created");
      setEditorOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save form",
      );
    }
  }

  async function deleteForm() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/agents/${agentId}/forms/${deleteTarget.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        toast.error("Failed to delete form");
        return;
      }

      setForms((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      toast.success("Form deleted");
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">External forms</h2>
          <p className="text-sm text-muted-foreground">
            Register forms on your website for validation and CRM mapping. Use{" "}
            <code className="text-xs">track.js</code> or the server-side form
            API to submit responses.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreateDialog}>
          <Plus />
          Add form
        </Button>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium">Tracking script</p>
        <p className="text-sm text-muted-foreground">
          Add this script to pages where you capture leads or track clicks.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg bg-background px-3 py-2 text-xs">
            {trackScript}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copySnippet(trackScript, "Script snippet")}
          >
            <Copy />
            Copy
          </Button>
        </div>
      </div>

      {forms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No external forms yet. Create one to use{" "}
          <code className="text-xs">data-losono-form=&quot;slug&quot;</code> on
          your site, or submit freeform responses via the API.
        </p>
      ) : (
        <div className="space-y-3">
          {forms.map((externalForm) => {
            const formSnippet = `<form data-losono-form="${externalForm.slug}">…</form>`;

            return (
              <article
                key={externalForm.id}
                className="space-y-3 rounded-xl border border-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{externalForm.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Slug <code className="text-xs">{externalForm.slug}</code>{" "}
                      · {externalForm.fields.length} field
                      {externalForm.fields.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void copySnippet(formSnippet, "Form snippet")
                      }
                    >
                      <Copy />
                      Copy snippet
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => openEditDialog(externalForm)}
                      aria-label={`Edit ${externalForm.name}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(externalForm)}
                      aria-label={`Delete ${externalForm.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingForm ? "Edit external form" : "Create external form"}
            </DialogTitle>
            <DialogDescription>
              Define fields for registered form capture. Submissions validate
              against this schema before syncing to Sales CRM.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="external-form-name">Name</FieldLabel>
                <Input
                  id="external-form-name"
                  {...form.register("name", {
                    onChange: (event) => {
                      if (!editingForm && !form.formState.dirtyFields.slug) {
                        form.setValue("slug", slugifyName(event.target.value), {
                          shouldDirty: false,
                        });
                      }
                    },
                  })}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.slug}>
                <FieldLabel htmlFor="external-form-slug">Slug</FieldLabel>
                <Input id="external-form-slug" {...form.register("slug")} />
                <FieldError errors={[form.formState.errors.slug]} />
              </Field>
            </FieldGroup>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Fields</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      id: createFieldId(),
                      label: "New field",
                      type: "text",
                      required: true,
                      placeholder: "",
                      options: "",
                    })
                  }
                >
                  <Plus />
                  Add field
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  Add at least one field for registered form capture.
                </p>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const fieldType = form.watch(`fields.${index}.type`);

                    return (
                      <div
                        key={field.id}
                        className="space-y-3 rounded-xl border border-border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <GripVertical className="size-4" />
                            <span className="text-sm font-medium text-foreground">
                              Field {index + 1}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => remove(index)}
                            aria-label={`Remove field ${index + 1}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            data-invalid={
                              !!form.formState.errors.fields?.[index]?.label
                            }
                          >
                            <FieldLabel>Label</FieldLabel>
                            <Input
                              {...form.register(`fields.${index}.label`)}
                            />
                            <FieldError
                              errors={[
                                form.formState.errors.fields?.[index]?.label,
                              ]}
                            />
                          </Field>

                          <Field>
                            <FieldLabel>Type</FieldLabel>
                            <Select
                              value={fieldType}
                              onValueChange={(value) =>
                                form.setValue(
                                  `fields.${index}.type`,
                                  value as FormValues["fields"][number]["type"],
                                  { shouldDirty: true },
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="textarea">
                                  Long text
                                </SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <Field>
                            <FieldLabel>Placeholder</FieldLabel>
                            <Input
                              {...form.register(`fields.${index}.placeholder`)}
                            />
                          </Field>

                          <Field orientation="horizontal">
                            <input
                              id={`external-field-required-${field.id}`}
                              type="checkbox"
                              className="size-4 rounded border border-input"
                              {...form.register(`fields.${index}.required`)}
                            />
                            <FieldLabel
                              htmlFor={`external-field-required-${field.id}`}
                            >
                              Required
                            </FieldLabel>
                          </Field>
                        </div>

                        {fieldType === "select" && (
                          <Field>
                            <FieldLabel>Options (one per line)</FieldLabel>
                            <Textarea
                              rows={3}
                              placeholder={"Option 1\nOption 2"}
                              {...form.register(`fields.${index}.options`)}
                            />
                          </Field>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter showCloseButton={false}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditorOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving…"
                  : editingForm
                    ? "Save changes"
                    : "Create form"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete external form?"
        description="Existing submissions will remain, but the form definition and declarative capture will stop working."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={deleteForm}
        loading={deleting}
      />
    </section>
  );
}
