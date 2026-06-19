import { auth } from "@/auth";
import { getAppUrl } from "@/lib/app-url";
import { ensureFreeSubscription } from "@/lib/billing/subscriptions";
import { countAgentsForUser } from "@/lib/db/queries/agents";
import {
  createBillingPortalSession,
  createCheckoutSession,
  isStripeConfigured,
} from "@/lib/stripe";

type CheckoutBody = {
  quantity?: number;
};

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return Response.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;

  if (!userId || !email) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CheckoutBody = {};
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    body = {};
  }

  const subscription = await ensureFreeSubscription(userId);
  const agentCount = await countAgentsForUser(userId);
  const requestedQuantity =
    typeof body.quantity === "number" && Number.isFinite(body.quantity)
      ? Math.floor(body.quantity)
      : Math.max(agentCount, subscription.agentLimit, 1);
  const quantity = Math.max(requestedQuantity, 1);

  const appUrl = getAppUrl();

  if (
    subscription.plan === "pro" &&
    subscription.stripeCustomerId &&
    subscription.stripeSubscriptionId
  ) {
    const portalSession = await createBillingPortalSession({
      stripeCustomerId: subscription.stripeCustomerId,
      returnUrl: `${appUrl}/billing`,
    });

    return Response.json({ url: portalSession.url, kind: "portal" });
  }

  const checkoutSession = await createCheckoutSession({
    userId,
    email,
    stripeCustomerId: subscription.stripeCustomerId,
    quantity,
    successUrl: `${appUrl}/billing?checkout=success`,
    cancelUrl: `${appUrl}/billing?checkout=canceled`,
  });

  if (!checkoutSession.url) {
    return Response.json({ error: "checkout_unavailable" }, { status: 500 });
  }

  return Response.json({ url: checkoutSession.url, kind: "checkout" });
}
