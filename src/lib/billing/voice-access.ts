import type { Agent, Subscription } from "@/lib/db/schema";

export type VoiceAccessResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
      code: "free_plan" | "agent_voice_disabled";
    };

/** Playground voice gate: subscription must include voice (Pro plan). */
export function canUseVoiceInPlayground(
  subscription: Subscription | null,
  agent: Agent,
): VoiceAccessResult {
  if (!subscription?.voiceEnabled) {
    return {
      allowed: false,
      reason: "Voice not available on free plan",
      code: "free_plan",
    };
  }

  if (!agent.voiceEnabled) {
    return {
      allowed: false,
      reason: "Voice is disabled for this agent",
      code: "agent_voice_disabled",
    };
  }

  return { allowed: true };
}
