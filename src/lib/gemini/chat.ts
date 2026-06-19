import { google } from "@ai-sdk/google";
import { env } from "@/lib/env";

export function getChatModel() {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }

  return google(env.GEMINI_CHAT_MODEL);
}
