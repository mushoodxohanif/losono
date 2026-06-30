"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type TrackingSettingsProps = {
  agentId: string;
  agentSlug: string;
  appUrl: string;
  published: boolean;
  allowedOriginsConfigured: boolean;
};

export function TrackingSettings({
  agentId,
  agentSlug,
  appUrl,
  published,
  allowedOriginsConfigured,
}: TrackingSettingsProps) {
  const scriptSnippet = `<script src="${appUrl}/track.js" data-agent="${agentSlug}"></script>`;

  const clickExample = `<a href="/brochure.pdf" data-losono-track="document_open"
   data-losono-props='{"documentId":"brochure-2024"}'>
  Download brochure
</a>`;

  const formExample = `<form data-losono-form="contact">
  <input name="email" type="email" required />
  <input name="name" type="text" />
  <button type="submit">Send</button>
</form>`;

  const apiExample = `Losono.track("product_view", { productId: "sku-123" });
Losono.identify({ email: "user@example.com", name: "Jane" });
Losono.submitForm({ email: "user@example.com", message: "Hello" });`;

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Tracking script</h2>
        <p className="text-sm text-muted-foreground">
          Add the script to your website to capture click events and external
          form submissions. The same{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            losono_visitor_id
          </code>{" "}
          is shared with the embed widget for cross-session identity.
        </p>
      </div>

      {!published && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          Publish this agent before events will be accepted from your site.
        </p>
      )}

      {!allowedOriginsConfigured && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          Configure allowed origins on the{" "}
          <Link
            href={`/agents/${agentId}/deploy`}
            className="font-medium underline"
          >
            Deploy
          </Link>{" "}
          page so browser requests from your site are accepted.
        </p>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="track-script-snippet">Script snippet</FieldLabel>
          <div className="flex gap-2">
            <Textarea
              id="track-script-snippet"
              readOnly
              rows={2}
              value={scriptSnippet}
              className="flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyText(scriptSnippet, "Script snippet")}
            >
              <Copy />
            </Button>
          </div>
        </Field>
      </FieldGroup>

      <div className="space-y-4 border-t border-border pt-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Setup guide</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Publish this agent</li>
            <li>
              Register external forms on the Forms page (optional — skip for
              freeform submissions)
            </li>
            <li>Configure allowed origins on the Deploy page</li>
            <li>Copy the script snippet above and add it before {`</body>`}</li>
            <li>Verify events appear in the sessions list below</li>
          </ol>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Declarative click tracking</p>
          <div className="flex gap-2">
            <Textarea
              readOnly
              rows={4}
              value={clickExample}
              className="flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyText(clickExample, "Click example")}
            >
              <Copy />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Declarative form capture</p>
          <div className="flex gap-2">
            <Textarea
              readOnly
              rows={5}
              value={formExample}
              className="flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyText(formExample, "Form example")}
            >
              <Copy />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Programmatic API</p>
          <div className="flex gap-2">
            <Textarea
              readOnly
              rows={4}
              value={apiExample}
              className="flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyText(apiExample, "API example")}
            >
              <Copy />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
