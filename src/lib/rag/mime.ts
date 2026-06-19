const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "video/mp4",
  "video/quicktime",
]);

export type IngestStrategy = "text" | "docx" | "pdf" | "multimodal";

export function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(normalizeMimeType(mimeType));
}

export function getIngestStrategy(mimeType: string): IngestStrategy {
  const normalized = normalizeMimeType(mimeType);

  if (
    normalized ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  if (normalized === "application/pdf") {
    return "pdf";
  }

  if (
    normalized.startsWith("image/") ||
    normalized.startsWith("audio/") ||
    normalized.startsWith("video/")
  ) {
    return "multimodal";
  }

  return "text";
}

export function listAllowedMimeTypes(): string[] {
  return [...ALLOWED_MIME_TYPES];
}
