"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type EmbedSettingsProps = {
  agentId: string;
  slug: string;
  appUrl: string;
  published: boolean;
  initialGreeting: string;
  initialPosition: "bottom-right" | "bottom-left";
  initialPrimaryColor: string;
  initialAllowedOrigins: string;
  initialModes: "chat" | "chat+voice";
};

export function EmbedSettings({
  agentId,
  slug,
  appUrl,
  published,
  initialGreeting,
  initialPosition,
  initialPrimaryColor,
  initialAllowedOrigins,
  initialModes,
}: EmbedSettingsProps) {
  const embedUrl = `${appUrl}/embed/${slug}`;
  const scriptSnippet = `<script src="${appUrl}/embed.js" data-agent="${slug}"></script>`;

  const [greeting, setGreeting] = useState(initialGreeting);
  const [position, setPosition] = useState(initialPosition);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  const [allowedOrigins, setAllowedOrigins] = useState(initialAllowedOrigins);
  const [modes, setModes] = useState(initialModes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveSettings() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const origins = allowedOrigins
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`/api/agents/${agentId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            allowedOrigins: origins,
            widgetTheme: {
              greeting,
              position,
              primaryColor,
              modes,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save embed settings");
      }

      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save embed settings",
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Embed widget</h2>
        <p className="text-sm text-muted-foreground">
          Add the script snippet to your site or share the hosted widget URL.
        </p>
      </div>

      {!published && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          Publish this agent to activate the public embed URL.
        </p>
      )}

      <div className="grid gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Hosted widget URL</span>
          <div className="flex gap-2">
            <input
              readOnly
              value={embedUrl}
              className="flex-1 rounded-xl border border-input bg-muted/40 px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyText(embedUrl)}
            >
              <Copy />
            </Button>
          </div>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Script snippet</span>
          <div className="flex gap-2">
            <textarea
              readOnly
              rows={2}
              value={scriptSnippet}
              className="flex-1 rounded-xl border border-input bg-muted/40 px-3 py-2 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyText(scriptSnippet)}
            >
              <Copy />
            </Button>
          </div>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Greeting</span>
          <input
            value={greeting}
            onChange={(event) => setGreeting(event.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Primary color</span>
          <input
            type="color"
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-1"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Launcher position</span>
          <select
            value={position}
            onChange={(event) =>
              setPosition(event.target.value as "bottom-right" | "bottom-left")
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2"
          >
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Modes</span>
          <select
            value={modes}
            onChange={(event) =>
              setModes(event.target.value as "chat" | "chat+voice")
            }
            className="w-full rounded-xl border border-input bg-background px-3 py-2"
          >
            <option value="chat">Chat only</option>
            <option value="chat+voice">Chat + voice</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">
          Allowed origins (one per line, empty = allow all)
        </span>
        <textarea
          rows={3}
          value={allowedOrigins}
          onChange={(event) => setAllowedOrigins(event.target.value)}
          placeholder={"https://example.com\nhttps://app.example.com"}
          className="w-full rounded-xl border border-input bg-background px-3 py-2"
        />
      </label>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={saveSettings} disabled={saving}>
          {saving ? "Saving…" : "Save embed settings"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </section>
  );
}
