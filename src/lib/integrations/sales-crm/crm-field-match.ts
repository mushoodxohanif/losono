import type { SalesCrmField } from "@/lib/integrations/sales-crm/types";
import type { PreChatField, PreChatFieldType } from "@/lib/pre-chat-form";

const PRE_CHAT_TO_CRM_TYPES: Record<PreChatFieldType, string[]> = {
  email: ["EMAIL"],
  phone: ["PHONE"],
  text: ["TEXT", "TEXTAREA"],
  textarea: ["TEXTAREA", "TEXT"],
  select: ["SELECT", "TEXT"],
};

export function normalizeCrmFieldLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function findCompatibleCrmField(
  preChatField: PreChatField,
  crmFields: SalesCrmField[],
  usedKeys: Set<string>,
): SalesCrmField | undefined {
  const compatibleTypes = PRE_CHAT_TO_CRM_TYPES[preChatField.type];
  const normalizedLabel = normalizeCrmFieldLabel(preChatField.label);

  const exactLabelMatch = crmFields.find(
    (crmField) =>
      !usedKeys.has(crmField.key) &&
      compatibleTypes.includes(crmField.type) &&
      normalizeCrmFieldLabel(crmField.label) === normalizedLabel,
  );

  if (exactLabelMatch) {
    return exactLabelMatch;
  }

  const fuzzyMatch = crmFields.find((crmField) => {
    if (
      usedKeys.has(crmField.key) ||
      !compatibleTypes.includes(crmField.type)
    ) {
      return false;
    }

    const normalizedKey = normalizeCrmFieldLabel(crmField.key);
    const normalizedCrmLabel = normalizeCrmFieldLabel(crmField.label);

    return (
      normalizedKey === normalizedLabel ||
      normalizedCrmLabel.includes(normalizedLabel) ||
      normalizedLabel.includes(normalizedCrmLabel)
    );
  });

  if (fuzzyMatch) {
    return fuzzyMatch;
  }

  if (preChatField.type === "email" || preChatField.type === "phone") {
    return crmFields.find(
      (crmField) =>
        !usedKeys.has(crmField.key) && crmField.type === compatibleTypes[0],
    );
  }

  return undefined;
}
