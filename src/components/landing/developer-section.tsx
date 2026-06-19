import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  SectionDescription,
  SectionEyebrow,
  SectionTitle,
} from "@/components/landing/landing-header";
import { Button } from "@/components/ui/button";
import { getAppUrl } from "@/lib/app-url";

export function DeveloperSection() {
  const appUrl = getAppUrl();

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <SectionEyebrow>Developers</SectionEyebrow>
              <SectionTitle className="mt-3 text-3xl sm:text-4xl">
                Ship with three lines of code
              </SectionTitle>
              <SectionDescription className="mt-4">
                REST chat with streaming, WebSocket voice, or a drop-in embed
                widget. Full API reference in the docs.
              </SectionDescription>
              <Button asChild className="mt-8 w-fit" variant="outline">
                <Link href="/docs">
                  Read the API docs
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="border-t border-border/60 bg-muted/30 p-6 sm:p-8 lg:border-t-0 lg:border-l">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Embed widget
                  </p>
                  <pre className="overflow-x-auto rounded-xl border border-border/60 bg-background p-4 font-mono text-xs leading-relaxed">
                    {`<script
  src="${appUrl}/embed.js"
  data-agent="your-agent-slug">
</script>`}
                  </pre>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Chat API
                  </p>
                  <pre className="overflow-x-auto rounded-xl border border-border/60 bg-background p-4 font-mono text-xs leading-relaxed">
                    {`POST /api/agents/{id}/chat
Authorization: Bearer losono_sk_...

{ "messages": [...] }`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
