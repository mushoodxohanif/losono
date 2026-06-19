"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type CreateAgentFormProps = {
  canCreate: boolean;
  limit: number;
  used: number;
  isPro: boolean;
};

export function CreateAgentForm({
  canCreate,
  limit,
  used,
  isPro,
}: CreateAgentFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = (await response.json()) as {
        agent?: { id: string };
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        if (data.error === "agent_limit_reached") {
          throw new Error(
            isPro
              ? "Agent seat limit reached. Add seats from billing."
              : "Free trial allows one agent. Upgrade to create more.",
          );
        }
        throw new Error(data.message ?? data.error ?? "Failed to create agent");
      }

      if (data.agent?.id) {
        router.push(`/agents/${data.agent.id}`);
        router.refresh();
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create agent",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Create agent</h2>
        <p className="text-sm text-muted-foreground">
          {used} / {limit} agent seat{limit === 1 ? "" : "s"} used
        </p>
      </div>

      {!canCreate && (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          {isPro
            ? "You've reached your seat limit. Add more seats from billing."
            : "Free trial includes one agent. Upgrade to Pro for more seats and voice."}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-wrap items-end gap-2"
      >
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Agent name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Support assistant"
            required
            disabled={!canCreate || loading}
            className="rounded-xl border border-input bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <Button type="submit" disabled={!canCreate || loading || !name.trim()}>
          {loading ? "Creating…" : "Create agent"}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
