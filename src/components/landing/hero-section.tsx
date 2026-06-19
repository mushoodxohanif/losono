import { ArrowRight, Code2, FileSearch, Play } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import {
  SectionDescription,
  SectionEyebrow,
} from "@/components/landing/landing-header";
import { WaveformBars } from "@/components/landing/waveform-bars";
import { Button } from "@/components/ui/button";

const heroChips = [
  { label: "Real-time voice", waveform: true },
  { label: "RAG-powered answers", icon: FileSearch },
  { label: "One-line embed", icon: Code2 },
] as const;

export function HeroSection({ mockup }: { mockup?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden pb-0">
      <div className="landing-mesh absolute inset-0" />
      <div className="landing-grid-pattern absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-6 pt-16 sm:pt-20 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="landing-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm backdrop-blur-sm">
            <Logo
              variant="mark"
              href={null}
              markClassName="size-5"
              className="size-5"
            />
            <SectionEyebrow className="normal-case tracking-normal text-muted-foreground">
              Multi-agent voice + chat platform
            </SectionEyebrow>
          </div>

          <h1 className="landing-fade-up landing-fade-up-delay-1 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.08]">
            Build agents that{" "}
            <span className="landing-gradient-text">speak and listen</span>
          </h1>

          <SectionDescription className="landing-fade-up landing-fade-up-delay-2 mx-auto mt-6">
            Create, test, and deploy AI agents with chat, voice, and document
            context. Ground every response in your knowledge base — powered by
            Gemini and Neon pgvector.
          </SectionDescription>

          <div className="landing-fade-up landing-fade-up-delay-3 mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/sign-in">
                Start building free
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="#how-it-works">
                <Play className="mr-1 size-4" />
                See how it works
              </Link>
            </Button>
          </div>

          <div className="landing-fade-up landing-fade-up-delay-3 mt-12 flex flex-wrap items-center justify-center gap-2">
            {heroChips.map((chip) => {
              const Icon = "icon" in chip ? chip.icon : null;

              return (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
                >
                  {"waveform" in chip ? (
                    <WaveformBars count={4} className="h-4 w-6" />
                  ) : Icon ? (
                    <Icon className="size-3.5 shrink-0 text-primary" />
                  ) : null}
                  {chip.label}
                </span>
              );
            })}
          </div>
        </div>

        {mockup}
      </div>
    </section>
  );
}
