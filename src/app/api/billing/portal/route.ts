import { auth } from "@/auth";
import { getAppUrl } from "@/lib/app-url";
import { getSubscriptionByUserId } from "@/lib/billing/subscriptions";
import { createBillingPortalSession, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  if (!isStripeConfigured()) {
    return Response.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionByUserId(userId);

  if (!subscription?.stripeCustomerId) {
    return Response.json({ error: "no_stripe_customer" }, { status: 400 });
  }

  const appUrl = getAppUrl();

  const portalSession = await createBillingPortalSession({
    stripeCustomerId: subscription.stripeCustomerId,
    returnUrl: `${appUrl}/billing`,
  });

  if (!portalSession.url) {
    return Response.json({ error: "portal_unavailable" }, { status: 500 });
  }

  return Response.json({ url: portalSession.url });
}
