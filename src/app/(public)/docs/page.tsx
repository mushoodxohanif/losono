import type { Metadata } from "next";
import { DocsContent } from "@/components/docs/docs-content";
import { getAppUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Integration guide",
  description:
    "Integrate Losono on your website with the embed widget, custom chat API, or lead tracking (track.js) for external forms and click events. Includes Sales CRM sync documentation.",
};

export default function DocsPage() {
  const appUrl = getAppUrl();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-16 pt-24 sm:pt-28">
      <DocsContent appUrl={appUrl} />
    </main>
  );
}
