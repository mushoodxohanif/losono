import { FileSearch, Mic, Rocket } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SectionEyebrow } from "@/components/landing/landing-header";
import { WaveformBars } from "@/components/landing/waveform-bars";

const highlights = [
  {
    icon: Mic,
    label: "Real-time voice agents",
  },
  {
    icon: FileSearch,
    label: "RAG-powered answers",
  },
  {
    icon: Rocket,
    label: "Deploy in minutes",
  },
] as const;

export function AuthBrandingPanel() {
  return (
    <div className="landing-fade-up hidden flex-col justify-center lg:flex">
      <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm backdrop-blur-sm">
        <Logo
          variant="mark"
          href={null}
          markClassName="size-5"
          className="size-5"
        />
        <SectionEyebrow className="normal-case tracking-normal text-muted-foreground">
          Multi-agent voice + chat
        </SectionEyebrow>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl xl:leading-[1.12]">
        Build agents that{" "}
        <span className="landing-gradient-text">speak and listen</span>
      </h1>

      <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        Create, test, and deploy AI agents with chat, voice, and document
        context — grounded in your knowledge base.
      </p>

      <div className="mt-10 flex items-center gap-4">
        <div className="relative flex size-20 items-center justify-center rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
          <div className="absolute -inset-1 rounded-2xl bg-primary/10 blur-sm" />
          <WaveformBars
            count={7}
            animated
            className="relative h-10 w-12"
            barClassName="bg-chart-2"
          />
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          Start with a free trial — one chat agent, playground access, and
          document RAG out of the box.
        </p>
      </div>

      <ul className="mt-10 space-y-3">
        {highlights.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-3 text-sm text-muted-foreground"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm">
              <Icon className="size-4 text-primary" />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
