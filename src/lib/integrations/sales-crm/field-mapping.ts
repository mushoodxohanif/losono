import type { CrmFieldMapping } from "@/lib/db/schema";
import { findCompatibleCrmField } from "@/lib/integrations/sales-crm/crm-field-match";
import type { SalesCrmField } from "@/lib/integrations/sales-crm/types";
import type { PreChatField } from "@/lib/pre-chat-form";

export {
  isSessionMappingReady,
  SESSION_CRM_FIELD_KEYS,
  type SessionCrmFieldKey,
  sessionFieldKey,
  suggestSessionMapping,
  transformSessionData,
} from "@/lib/integrations/sales-crm/session-fields";

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function suggestFieldMapping(
  preChatFields: PreChatField[],
  crmFields: SalesCrmField[],
): CrmFieldMapping {
  const mapping: CrmFieldMapping = {};
  const usedKeys = new Set<string>();

  for (const field of preChatFields) {
    const match = findCompatibleCrmField(field, crmFields, usedKeys);

    if (match) {
      mapping[field.id] = match.key;
      usedKeys.add(match.key);
    }
  }

  return mapping;
}

export function isFieldMappingReady(
  preChatFields: PreChatField[],
  mapping: CrmFieldMapping,
): boolean {
  if (preChatFields.length === 0) {
    return false;
  }

  return preChatFields.some((field) => Boolean(mapping[field.id]?.trim()));
}

export function transformSubmissionResponses(
  responses: Record<string, string>,
  mapping: CrmFieldMapping,
): Record<string, string> {
  const fieldValues: Record<string, string> = {};

  for (const [fieldId, crmKey] of Object.entries(mapping)) {
    if (!crmKey.trim()) {
      continue;
    }

    const value = responses[fieldId];
    if (value !== undefined && value !== "") {
      fieldValues[crmKey] = value;
    }
  }

  return fieldValues;
}

export const FREEFORM_CRM_FIELD_KEYS = [
  "email",
  "name",
  "phone",
  "company",
  "message",
] as const;

export type FreeformCrmFieldKey = (typeof FREEFORM_CRM_FIELD_KEYS)[number];

export function externalFormFieldKey(formId: string, fieldId: string): string {
  return `external:${formId}:${fieldId}`;
}

export function freeformFieldKey(key: string): string {
  return `external:freeform:${key}`;
}

export function suggestExternalFormMapping(
  formId: string,
  fields: PreChatField[],
  crmFields: SalesCrmField[],
): CrmFieldMapping {
  const baseMapping = suggestFieldMapping(fields, crmFields);

  return Object.fromEntries(
    Object.entries(baseMapping).map(([fieldId, crmKey]) => [
      externalFormFieldKey(formId, fieldId),
      crmKey,
    ]),
  );
}

export function suggestFreeformMapping(
  crmFields: SalesCrmField[],
): CrmFieldMapping {
  const mapping: CrmFieldMapping = {};
  const usedKeys = new Set<string>();

  for (const key of FREEFORM_CRM_FIELD_KEYS) {
    const pseudoField: PreChatField = {
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      type:
        key === "email"
          ? "email"
          : key === "phone"
            ? "phone"
            : key === "message"
              ? "textarea"
              : "text",
      required: false,
    };

    const match = findCompatibleCrmField(pseudoField, crmFields, usedKeys);

    if (match) {
      mapping[freeformFieldKey(key)] = match.key;
      usedKeys.add(match.key);
    }
  }

  return mapping;
}

export function isExternalFormMappingReady(
  fields: PreChatField[],
  mapping: CrmFieldMapping,
  formId: string,
): boolean {
  if (fields.length === 0) {
    return false;
  }

  return fields.some((field) =>
    Boolean(mapping[externalFormFieldKey(formId, field.id)]?.trim()),
  );
}

export function isFreeformMappingReady(mapping: CrmFieldMapping): boolean {
  return FREEFORM_CRM_FIELD_KEYS.some((key) =>
    Boolean(mapping[freeformFieldKey(key)]?.trim()),
  );
}

export function transformExternalFormResponses(
  responses: Record<string, string>,
  mapping: CrmFieldMapping,
  formId: string,
): Record<string, string> {
  const namespacedMapping: CrmFieldMapping = {};

  for (const fieldId of Object.keys(responses)) {
    const key = externalFormFieldKey(formId, fieldId);
    if (mapping[key]) {
      namespacedMapping[fieldId] = mapping[key];
    }
  }

  return transformSubmissionResponses(responses, namespacedMapping);
}

export function transformFreeformResponses(
  responses: Record<string, string>,
  mapping: CrmFieldMapping,
): Record<string, string> {
  const fieldValues: Record<string, string> = {};

  for (const [responseKey, value] of Object.entries(responses)) {
    if (!value.trim()) {
      continue;
    }

    const normalizedKey = normalizeLabel(responseKey);
    const directMapping = mapping[freeformFieldKey(responseKey)];

    if (directMapping?.trim()) {
      fieldValues[directMapping] = value;
      continue;
    }

    const matchedCommonKey = FREEFORM_CRM_FIELD_KEYS.find(
      (key) => normalizeLabel(key) === normalizedKey,
    );

    if (matchedCommonKey) {
      const crmKey = mapping[freeformFieldKey(matchedCommonKey)];
      if (crmKey?.trim()) {
        fieldValues[crmKey] = value;
      }
    }
  }

  return fieldValues;
}
