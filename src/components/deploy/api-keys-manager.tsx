"use client";

import { Copy, KeyRound, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ApiKeySummary = {
  id: string;
  name: string;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
};

type ApiKeysManagerProps = {
  agentId: string;
  published: boolean;
  initialKeys: ApiKeySummary[];
};

export function ApiKeysManager({
  agentId,
  published,
  initialKeys,
}: ApiKeysManagerProps) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createKey() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Default key" }),
      });

      const data = (await response.json()) as {
        rawKey?: string;
        key?: ApiKeySummary;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create API key");
      }

      if (data.key && data.rawKey) {
        setKeys((current) => [data.key as ApiKeySummary, ...current]);
        setRawKey(data.rawKey);
        setName("");
        router.refresh();
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create API key",
      );
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(keyId: string) {
    setError(null);

    const response = await fetch(`/api/agents/${agentId}/api-keys/${keyId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Failed to revoke API key");
      return;
    }

    setKeys((current) => current.filter((key) => key.id !== keyId));
    router.refresh();
  }

  async function copyRawKey() {
    if (!rawKey) {
      return;
    }

    await navigator.clipboard.writeText(rawKey);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">API keys</h2>
        <p className="text-sm text-muted-foreground">
          Use Bearer tokens for server-side integrations. Keys are shown once
          when created.
        </p>
      </div>

      {!published && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          Publish this agent before creating API keys.
        </p>
      )}

      {rawKey && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium">Copy your new API key now</p>
          <p className="mt-1 text-muted-foreground">
            This secret will not be shown again.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-muted px-2 py-1 text-xs break-all">
              {rawKey}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={copyRawKey}
            >
              <Copy />
              Copy
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRawKey(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Key name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Production website"
            disabled={!published || loading}
            className="rounded-xl border border-input bg-background px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <Button
          type="button"
          disabled={!published || loading}
          onClick={createKey}
        >
          <KeyRound />
          Generate key
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ul className="divide-y divide-border rounded-xl border border-border">
        {keys.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">
            No active API keys yet.
          </li>
        ) : (
          keys.map((key) => (
            <li
              key={key.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="text-muted-foreground">
                  Created {new Date(key.createdAt).toLocaleString()}
                  {key.lastUsedAt
                    ? ` · Last used ${new Date(key.lastUsedAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => revokeKey(key.id)}
              >
                <Trash2 />
                Revoke
              </Button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
