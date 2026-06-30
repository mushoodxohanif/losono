import { z } from "zod";
import { auth } from "@/auth";
import { getAgentForUser } from "@/lib/db/queries/agents";
import {
  deleteExternalForm,
  getExternalFormById,
  getExternalFormBySlug,
  updateExternalForm,
} from "@/lib/db/queries/external-forms";
import { PRE_CHAT_FIELD_TYPES, type PreChatField } from "@/lib/pre-chat-form";

type RouteParams = { params: Promise<{ id: string; formId: string }> };

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens",
  );

const fieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(PRE_CHAT_FIELD_TYPES),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string().min(1)).optional(),
});

const updateFormSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: slugSchema.optional(),
  fields: z.array(fieldSchema).max(12).optional(),
});

async function requireOwner(agentId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  }

  const agent = await getAgentForUser(agentId, userId);
  if (!agent) {
    return {
      error: Response.json({ error: "agent_not_found" }, { status: 404 }),
    };
  }

  return { userId, agent };
}

function normalizeFields(
  fields: z.infer<typeof fieldSchema>[],
): PreChatField[] {
  return fields.map((field) => ({
    id: field.id,
    label: field.label.trim(),
    type: field.type,
    required: field.required,
    placeholder: field.placeholder?.trim() || undefined,
    options: field.type === "select" ? field.options : undefined,
  }));
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: agentId, formId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const form = await getExternalFormById(agentId, formId);

  if (!form) {
    return Response.json({ error: "form_not_found" }, { status: 404 });
  }

  return Response.json({ form });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: agentId, formId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const existing = await getExternalFormById(agentId, formId);

  if (!existing) {
    return Response.json({ error: "form_not_found" }, { status: 404 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateFormSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const slugConflict = await getExternalFormBySlug(agentId, parsed.data.slug);

    if (slugConflict && slugConflict.id !== formId) {
      return Response.json({ error: "slug_taken" }, { status: 409 });
    }
  }

  const updateInput: {
    name?: string;
    slug?: string;
    fields?: PreChatField[];
  } = {};

  if (parsed.data.name !== undefined) {
    updateInput.name = parsed.data.name.trim();
  }

  if (parsed.data.slug !== undefined) {
    updateInput.slug = parsed.data.slug;
  }

  if (parsed.data.fields !== undefined) {
    const fields = normalizeFields(parsed.data.fields);

    if (
      fields.some((field) => field.type === "select" && !field.options?.length)
    ) {
      return Response.json(
        { error: "validation_failed", message: "Select fields need options" },
        { status: 400 },
      );
    }

    updateInput.fields = fields;
  }

  const form = await updateExternalForm(agentId, formId, updateInput);

  return Response.json({ form });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: agentId, formId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const form = await deleteExternalForm(agentId, formId);

  if (!form) {
    return Response.json({ error: "form_not_found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
