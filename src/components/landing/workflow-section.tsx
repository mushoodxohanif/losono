import { Rocket, Settings, TestTube, Upload } from "lucide-react";
import {
  SectionDescription,
  SectionEyebrow,
  SectionTitle,
} from "@/components/landing/landing-header";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: "01",
    icon: Settings,
    title: "Create your agent",
    description:
      "Sign in with Google, name your agent, and write a system prompt that reflects your brand voice.",
  },
  {
    step: "02",
    icon: Upload,
    title: "Upload context",
    description:
      "Drop in docs, PDFs, and media. Losono chunks, embeds, and indexes everything in Neon pgvector.",
  },
  {
    step: "03",
    icon: TestTube,
    title: "Test in playground",
    description:
      "Chat and talk to your agent in sandbox mode. Preview retrieved context before going live.",
  },
  {
    step: "04",
    icon: Rocket,
    title: "Publish & deploy",
    description:
      "Flip the switch, generate API keys, and embed a widget on your site — or integrate via REST.",
  },
];

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>How it works</SectionEyebrow>
          <SectionTitle className="mt-3">
            From idea to live agent in minutes
          </SectionTitle>
          <SectionDescription className="mx-auto mt-4">
            No infrastructure to manage. No vector database to configure. Just
            build, test, and ship.
          </SectionDescription>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-8 top-0 hidden h-full w-px bg-linear-to-br from-primary/40 via-border to-transparent sm:left-1/2 sm:block sm:-translate-x-px" />

          <div className="space-y-12 sm:space-y-0">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative grid items-center gap-6 sm:grid-cols-2 sm:gap-12 sm:py-10"
              >
                <div
                  className={cn(
                    "space-y-4",
                    index % 2 === 1
                      ? "sm:order-2 sm:text-left"
                      : "sm:text-right",
                  )}
                >
                  <span className="font-mono text-xs font-medium text-primary">
                    {step.step}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex",
                    index % 2 === 1
                      ? "sm:order-1 sm:justify-end"
                      : "sm:justify-start",
                  )}
                >
                  <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                    <div className="absolute -inset-1 rounded-2xl bg-primary/10 blur-sm" />
                    <step.icon className="relative size-7 text-primary" />
                  </div>
                </div>

                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 z-10 hidden size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary sm:block"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
