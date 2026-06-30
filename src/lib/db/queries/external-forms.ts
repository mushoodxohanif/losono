import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { externalForms } from "@/lib/db/schema";
import type { PreChatField } from "@/lib/pre-chat-form";

export async function listExternalFormsForAgent(agentId: string) {
  return getDb()
    .select()
    .from(externalForms)
    .where(eq(externalForms.agentId, agentId))
    .orderBy(desc(externalForms.createdAt));
}

export async function getExternalFormById(agentId: string, formId: string) {
  const [form] = await getDb()
    .select()
    .from(externalForms)
    .where(
      and(eq(externalForms.agentId, agentId), eq(externalForms.id, formId)),
    )
    .limit(1);

  return form ?? null;
}

export async function getExternalFormBySlug(agentId: string, slug: string) {
  const [form] = await getDb()
    .select()
    .from(externalForms)
    .where(
      and(eq(externalForms.agentId, agentId), eq(externalForms.slug, slug)),
    )
    .limit(1);

  return form ?? null;
}

export async function createExternalForm(input: {
  agentId: string;
  name: string;
  slug: string;
  fields: PreChatField[];
}) {
  const [form] = await getDb()
    .insert(externalForms)
    .values({
      agentId: input.agentId,
      name: input.name,
      slug: input.slug,
      fields: input.fields,
    })
    .returning();

  return form;
}

export async function updateExternalForm(
  agentId: string,
  formId: string,
  input: {
    name?: string;
    slug?: string;
    fields?: PreChatField[];
  },
) {
  const [form] = await getDb()
    .update(externalForms)
    .set(input)
    .where(
      and(eq(externalForms.agentId, agentId), eq(externalForms.id, formId)),
    )
    .returning();

  return form ?? null;
}

export async function deleteExternalForm(agentId: string, formId: string) {
  const [form] = await getDb()
    .delete(externalForms)
    .where(
      and(eq(externalForms.agentId, agentId), eq(externalForms.id, formId)),
    )
    .returning();

  return form ?? null;
}
