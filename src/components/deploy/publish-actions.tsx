"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AgentStatus } from "@/lib/db/schema";

type PublishActionsProps = {
  agentId: string;
  status: AgentStatus;
  canPublish: boolean;
};

export function PublishActions({
  agentId,
  status,
  canPublish,
}: PublishActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function togglePublish() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/publish`, {
        method: status === "published" ? "DELETE" : "POST",
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? "Failed to update publish status");
      }

      router.refresh();
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Failed to update publish status",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={togglePublish}
        disabled={loading || (status !== "published" && !canPublish)}
        variant={status === "published" ? "outline" : "default"}
        title={
          canPublish || status === "published"
            ? undefined
            : "Add a user prompt before publishing"
        }
      >
        {loading
          ? "Updating…"
          : status === "published"
            ? "Unpublish"
            : "Publish agent"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
