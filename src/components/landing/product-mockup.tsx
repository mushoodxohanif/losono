"use client";

import {
  Bot,
  FileText,
  Globe,
  Key,
  MessageSquare,
  Mic,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import {
  type MockupTabId,
  mockupTabs,
  useMockup,
} from "@/components/landing/product-mockup-context";
import { WaveformBars } from "@/components/landing/waveform-bars";
import { cn } from "@/lib/utils";

const tabIcons = {
  chat: MessageSquare,
  voice: Mic,
  deploy: Globe,
} as const;

function MockChatTop() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-hidden p-5 sm:p-6">
        <div className="flex gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="size-4 text-primary" />
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-sm leading-relaxed">
            Hi! I&apos;m your support agent. I can answer questions about
            pricing, features, and onboarding — grounded in your docs.
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm text-primary-foreground">
            What&apos;s included in the Pro plan?
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="size-4 text-primary" />
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-sm leading-relaxed">
            Pro unlocks voice mode, unlimited context files, additional agent
            seats, and production deploy via API keys and embed widget.
          </div>
        </div>
      </div>
    </div>
  );
}

function MockChatBottom() {
  return (
    <div className="flex h-full flex-col justify-end">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <FileText className="size-3" />
          <span>Retrieved from pricing.pdf</span>
        </div>
        <div className="border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
            <span className="flex-1 text-sm text-muted-foreground">
              Ask anything about your product…
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockVoiceTop() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 sm:gap-8">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 landing-pulse-ring" />
        <div className="relative flex size-32 items-center justify-center rounded-full bg-linear-to-br from-primary to-chart-2 shadow-lg shadow-primary/25 sm:size-36">
          <Mic className="size-11 text-primary-foreground sm:size-12" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-medium">Listening…</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gemini Live · real-time voice
        </p>
      </div>
    </div>
  );
}

function MockVoiceBottom() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 sm:gap-8 sm:p-8">
      <WaveformBars
        animated
        spread
        count={96}
        className="h-16 w-full max-w-2xl sm:h-20"
        barClassName="bg-linear-to-t from-chart-2 to-primary w-full"
      />
      <div className="w-full max-w-md rounded-xl border border-border/60 bg-muted/50 px-4 py-3.5 text-center text-sm text-muted-foreground">
        &ldquo;Walk me through the onboarding flow&rdquo;
      </div>
    </div>
  );
}

function MockDeployTop() {
  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-primary" />
          <span className="text-sm font-medium">Published</span>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          Live
        </span>
      </div>
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Key className="size-3" />
          API Key
        </div>
        <code className="block truncate font-mono text-xs">
          losono_sk_live_••••••••••••
        </code>
      </div>
    </div>
  );
}

function MockDeployBottom() {
  return (
    <div className="flex h-full flex-col justify-end p-5 sm:p-6">
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Globe className="size-3" />
            Embed snippet
          </div>
          <code className="block truncate font-mono text-xs text-accent-foreground">
            {'<script src="…/embed.js" data-agent="acme">'}
          </code>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: "Conversations", value: "1.2k" },
            { label: "Avg response", value: "1.4s" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border/60 bg-background px-3 py-2.5 text-center"
            >
              <p className="text-sm font-semibold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockContent({
  segment,
  activeTab,
}: {
  segment: "top" | "bottom";
  activeTab: MockupTabId;
}) {
  if (activeTab === "chat") {
    return segment === "top" ? <MockChatTop /> : <MockChatBottom />;
  }
  if (activeTab === "voice") {
    return segment === "top" ? <MockVoiceTop /> : <MockVoiceBottom />;
  }
  return segment === "top" ? <MockDeployTop /> : <MockDeployBottom />;
}

function MockupSidebar({ segment }: { segment: "top" | "bottom" }) {
  if (segment === "top") {
    return (
      <div className="hidden w-48 shrink-0 border-r border-border/60 p-4 sm:block lg:w-52">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Agents
        </p>
        {["Support Bot", "Sales Assistant", "Onboarding"].map((name, i) => (
          <div
            key={name}
            className={cn(
              "mb-0.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
              i === 0
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground",
            )}
          >
            <Sparkles className="size-3" />
            {name}
          </div>
        ))}
        <div className="mt-4 border-t border-border/60 pt-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Context
          </p>
          {["pricing.pdf", "faq.md"].map((file) => (
            <div
              key={file}
              className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground"
            >
              <Upload className="size-3" />
              {file}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden w-48 shrink-0 border-r border-border/60 p-4 lg:w-52 sm:flex flex-col items-start justify-end">
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Context
      </p>
      {["guide.docx", "onboarding.mp4", "policies.pdf"].map((file) => (
        <div
          key={file}
          className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground"
        >
          <Upload className="size-3" />
          {file}
        </div>
      ))}
    </div>
  );
}

function MockupChrome() {
  const { activeTab, setActiveTab } = useMockup();

  return (
    <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
      <div className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
      </div>
      <div className="mx-auto flex items-center gap-1 rounded-lg bg-background/80 p-0.5">
        {mockupTabs.map((tab) => {
          const Icon = tabIcons[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="w-[52px]" />
    </div>
  );
}

export function ProductMockupTop() {
  const { activeTab } = useMockup();

  return (
    <div className="landing-fade-up landing-fade-up-delay-4 relative mx-auto w-full max-w-5xl">
      <div className="absolute -inset-4 rounded-[2rem] bg-linear-to-b from-primary/20 via-chart-2/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-t-2xl border border-border/80 border-b-0 bg-card shadow-2xl shadow-primary/5">
        <MockupChrome />
        <div className="flex bg-muted/20">
          <MockupSidebar segment="top" />
          <div className="h-[min(52vh,520px)] min-h-[420px] flex-1 bg-background/50 sm:min-h-[480px]">
            <MockContent segment="top" activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductMockupBottom() {
  const { activeTab } = useMockup();

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-b-2xl border border-border/80 border-t-0 bg-card shadow-2xl shadow-primary/5">
        <div className="flex bg-muted/20">
          <MockupSidebar segment="bottom" />
          <div className="h-[min(32vh,360px)] min-h-[260px] flex-1 bg-background/50 sm:min-h-[300px]">
            <MockContent segment="bottom" activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
