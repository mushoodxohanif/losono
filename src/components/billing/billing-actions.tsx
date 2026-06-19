"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type BillingActionsProps = {
  stripeReady: boolean;
  isPro: boolean;
  hasStripeSubscription: boolean;
  agentCount: number;
  agentLimit: number;
};

export function BillingActions({
  stripeReady,
  isPro,
  hasStripeSubscription,
  agentCount,
  agentLimit,
}: BillingActionsProps) {
  const [quantity, setQuantity] = useState(Math.max(agentCount, agentLimit, 1));
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading("checkout");
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
        kind?: "checkout" | "portal";
      };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout",
      );
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not open billing portal");
      }

      window.location.assign(data.url);
    } catch (portalError) {
      setError(
        portalError instanceof Error
          ? portalError.message
          : "Could not open billing portal",
      );
      setLoading(null);
    }
  }

  if (!stripeReady) {
    return (
      <p className="text-sm text-muted-foreground">
        Stripe is not configured yet. Add your Stripe keys and price ID to
        enable checkout.
      </p>
    );
  }

  if (isPro && hasStripeSubscription) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Update seat count, payment method, or cancel your subscription in the
          Stripe customer portal.
        </p>
        <Button
          onClick={openPortal}
          disabled={loading !== null}
          variant="default"
        >
          {loading === "portal" ? "Opening…" : "Manage subscription"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="seat-quantity"
          className="text-sm font-medium text-foreground"
        >
          Agent seats
        </label>
        <input
          id="seat-quantity"
          type="number"
          min={Math.max(agentCount, 1)}
          value={quantity}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            setQuantity(Number.isFinite(next) ? Math.max(next, 1) : 1);
          }}
          className="h-9 w-24 rounded-lg border border-border bg-background px-3 text-sm"
        />
        <p className="text-sm text-muted-foreground">
          {agentCount > 1
            ? `You have ${agentCount} agents — choose at least ${agentCount} seats.`
            : "Each seat includes voice, unlimited context files, and deployment."}
        </p>
      </div>
      <Button onClick={startCheckout} disabled={loading !== null}>
        {loading === "checkout" ? "Redirecting…" : "Subscribe to Pro"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
