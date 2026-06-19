import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  agents,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
  subscriptions,
} from "@/lib/db/schema";

export const FREE_TRIAL_AGENT_LIMIT = 1;

export async function getSubscriptionByUserId(
  userId: string,
): Promise<Subscription | null> {
  const [subscription] = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return subscription ?? null;
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
): Promise<Subscription | null> {
  const [subscription] = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
    .limit(1);

  return subscription ?? null;
}

export async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string,
): Promise<Subscription | null> {
  const [subscription] = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  return subscription ?? null;
}

export async function createFreeSubscription(
  userId: string,
): Promise<Subscription> {
  const [subscription] = await getDb()
    .insert(subscriptions)
    .values({
      userId,
      plan: "free",
      agentLimit: FREE_TRIAL_AGENT_LIMIT,
      voiceEnabled: false,
      status: "active",
    })
    .returning();

  return subscription;
}

/** Idempotent: creates a free trial row if the user has no subscription yet. */
export async function ensureFreeSubscription(
  userId: string,
): Promise<Subscription> {
  const existing = await getSubscriptionByUserId(userId);
  if (existing) {
    return existing;
  }

  return createFreeSubscription(userId);
}

export async function updateSubscriptionByUserId(
  userId: string,
  data: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    plan?: SubscriptionPlan;
    agentLimit?: number;
    voiceEnabled?: boolean;
    status?: SubscriptionStatus;
  },
): Promise<Subscription | null> {
  const [subscription] = await getDb()
    .update(subscriptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
    .returning();

  return subscription ?? null;
}

export async function syncProSubscription({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  agentLimit,
  status,
}: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  agentLimit: number;
  status: SubscriptionStatus;
}): Promise<Subscription | null> {
  const subscription = await updateSubscriptionByUserId(userId, {
    stripeCustomerId,
    stripeSubscriptionId,
    plan: "pro",
    agentLimit: Math.max(agentLimit, 1),
    voiceEnabled: true,
    status,
  });

  await getDb()
    .update(agents)
    .set({ voiceEnabled: true, updatedAt: new Date() })
    .where(eq(agents.userId, userId));

  return subscription;
}

export async function revertToFreePlan(
  userId: string,
): Promise<Subscription | null> {
  return updateSubscriptionByUserId(userId, {
    stripeSubscriptionId: null,
    plan: "free",
    agentLimit: FREE_TRIAL_AGENT_LIMIT,
    voiceEnabled: false,
    status: "active",
  });
}
