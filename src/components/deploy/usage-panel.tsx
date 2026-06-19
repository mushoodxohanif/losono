import type { AgentUsageSummary } from "@/lib/db/queries/usage";

type UsagePanelProps = {
  usage: AgentUsageSummary;
};

export function UsagePanel({ usage }: UsagePanelProps) {
  const stats = [
    { label: "Chat messages", value: usage.chatMessages },
    { label: "Voice minutes", value: usage.voiceMinutes },
    { label: "Context files", value: usage.contextFiles },
    { label: "Live conversations", value: usage.conversations },
    {
      label: "Messages (30 days)",
      value: usage.last30Days.chatMessages,
    },
    {
      label: "Voice minutes (30 days)",
      value: usage.last30Days.voiceMinutes,
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-medium">Usage dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Deployed traffic only — playground sessions are excluded.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-muted/20 px-4 py-3"
          >
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">
              {stat.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
