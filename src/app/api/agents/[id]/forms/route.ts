import { z } from "zod";
import { auth } from "@/auth";
import { getAgentForUser } from "@/lib/db/queries/agents";
import {
  createExternalForm,
  getExternalFormBySlug,
  listExternalFormsForAgent,
} from "@/lib/db/queries/external-forms";
import { PRE_CHAT_FIELD_TYPES, type PreChatField } from "@/lib/pre-chat-form";

type RouteParams = { params: Promise<{ id: string }> };

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens",
  );

const fieldSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().min(1),
  type: z.enum(PRE_CHAT_FIELD_TYPES),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string().min(1)).optional(),
});

const createFormSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  fields: z.array(fieldSchema).max(12),
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
    id: field.id ?? crypto.randomUUID(),
    label: field.label.trim(),
    type: field.type,
    required: field.required,
    placeholder: field.placeholder?.trim() || undefined,
    options: field.type === "select" ? field.options : undefined,
  }));
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  const forms = await listExternalFormsForAgent(agentId);

  return Response.json({ forms });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id: agentId } = await params;
  const access = await requireOwner(agentId);

  if ("error" in access) {
    return access.error;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createFormSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const fields = normalizeFields(parsed.data.fields);

  if (
    fields.some((field) => field.type === "select" && !field.options?.length)
  ) {
    return Response.json(
      { error: "validation_failed", message: "Select fields need options" },
      { status: 400 },
    );
  }

  const existing = await getExternalFormBySlug(agentId, parsed.data.slug);

  if (existing) {
    return Response.json({ error: "slug_taken" }, { status: 409 });
  }

  try {
    const form = await createExternalForm({
      agentId,
      name: parsed.data.name.trim(),
      slug: parsed.data.slug,
      fields,
    });

    return Response.json({ form }, { status: 201 });
  } catch (error) {
    console.error("Failed to create external form:", error);
    return Response.json({ error: "create_failed" }, { status: 500 });
  }
}
