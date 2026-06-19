import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Code2,
  FileSearch,
  Layers,
  MessageSquare,
  Mic,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  SectionDescription,
  SectionEyebrow,
  SectionTitle,
} from "@/components/landing/landing-header";
import { WaveformBars } from "@/components/landing/waveform-bars";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  accent: string;
  variant?: "default" | "featured" | "wide" | "compact";
};

function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  accent,
  variant = "default",
}: FeatureCardProps) {
  const isFeatured = variant === "featured";
  const isWide = variant === "wide";
  const isCompact = variant === "compact";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        isCompact ? "p-5" : "p-6",
        isFeatured && "flex min-h-[280px] flex-col justify-between md:min-h-0",
        isWide && "md:flex md:items-center md:gap-8 md:p-8",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-br transition-opacity",
          isFeatured ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          accent,
        )}
      />
      {isFeatured && (
        <div
          className="pointer-events-none absolute -right-8 -bottom-4 opacity-40"
          aria-hidden
        >
          <WaveformBars
            animated
            count={8}
            className="h-24 w-40"
            barClassName="w-1.5 bg-primary/30"
          />
        </div>
      )}
      <div
        className={cn(
          "relative",
          isWide && "md:flex md:flex-1 md:items-start md:gap-6",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
            isFeatured ? "mb-5 size-11" : "mb-4 size-10",
            isWide && "md:mb-0 md:size-12 shrink-0",
            isCompact && "mb-3 size-9",
          )}
        >
          <Icon
            className={cn(
              isFeatured ? "size-5" : isCompact ? "size-4" : "size-5",
              isWide && "md:size-6",
            )}
          />
        </div>
        <div className={isWide ? "md:flex-1" : undefined}>
          <h3
            className={cn(
              "font-semibold tracking-tight",
              isFeatured ? "text-xl" : isCompact ? "text-sm" : "text-lg",
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "leading-relaxed text-muted-foreground",
              isFeatured ? "mt-3 max-w-sm text-sm" : "mt-2 text-sm",
              isCompact && "mt-1 text-xs",
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

const primaryFeatures = [
  {
    icon: MessageSquare,
    title: "Streaming chat",
    description:
      "Deploy conversational agents with AI SDK streaming. Every reply grounded in your uploaded context.",
    className: "md:col-span-2 md:row-span-2",
    accent: "from-primary/10 via-primary/5 to-transparent",
    variant: "featured" as const,
  },
  {
    icon: Mic,
    title: "Live voice",
    description:
      "Gemini Live over WebSocket. Talk naturally in the playground, then ship voice to production.",
    className: "md:col-span-2 md:row-span-1",
    accent: "from-chart-2/10 to-chart-2/5",
  },
  {
    icon: FileSearch,
    title: "Document RAG",
    description:
      "PDF, DOCX, markdown, images, audio, and video — chunked, embedded, and retrieved via pgvector.",
    className: "md:col-span-1 md:row-span-1",
    accent: "from-accent/30 to-accent/10",
  },
  {
    icon: Layers,
    title: "Multi-agent",
    description:
      "Run separate agents for support, sales, and onboarding — each with its own prompt and knowledge.",
    className: "md:col-span-1 md:row-span-1",
    accent: "from-primary/10 to-chart-2/5",
  },
  {
    icon: Code2,
    title: "Developer-first deploy",
    description:
      "REST chat API, WebSocket voice, and a one-line embed widget. API keys with losono_sk prefix.",
    className: "md:col-span-4 md:row-span-1",
    accent: "from-muted to-muted/50",
    variant: "wide" as const,
  },
];

const secondaryFeatures = [
  {
    icon: Bot,
    title: "Custom system prompts",
    description: "Fine-tune personality and boundaries per agent",
    accent: "from-primary/5 to-transparent",
  },
  {
    icon: Shield,
    title: "Sandbox mode",
    description: "Test safely before publishing to production",
    accent: "from-chart-2/5 to-transparent",
  },
  {
    icon: Sparkles,
    title: "Conversation logs",
    description: "Review every interaction and track usage",
    accent: "from-accent/20 to-transparent",
  },
];

export function FeaturesSection({ mockup }: { mockup?: React.ReactNode }) {
  return (
    <section id="features" className="bg-muted/20 pt-0 pb-24 sm:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        {mockup}

        <div className="mx-auto mt-20 max-w-2xl text-center sm:mt-24">
          <SectionEyebrow>Features</SectionEyebrow>
          <SectionTitle className="mt-3">
            Everything you need to ship AI agents
          </SectionTitle>
          <SectionDescription className="mx-auto mt-4">
            From sandbox to production in one platform. Chat, voice, retrieval,
            and deployment — without stitching together five different tools.
          </SectionDescription>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-[repeat(3,minmax(0,auto))]">
          {primaryFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {secondaryFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
}
