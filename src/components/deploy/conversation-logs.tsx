"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ConversationSummary = {
  id: string;
  mode: string;
  visitorId: string | null;
  createdAt: string | Date;
  messageCount: number;
};

type ConversationDetail = {
  conversation: ConversationSummary;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string | Date;
  }>;
};

type ConversationLogsProps = {
  agentId: string;
  initialConversations: ConversationSummary[];
};

export function ConversationLogs({
  agentId,
  initialConversations,
}: ConversationLogsProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetch(
      `/api/agents/${agentId}/conversations?conversationId=${selectedId}`,
    )
      .then((response) => response.json())
      .then((data: ConversationDetail) => {
        if (!cancelled) {
          setDetail(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [agentId, selectedId]);

  async function refreshList() {
    const response = await fetch(`/api/agents/${agentId}/conversations`);
    const data = (await response.json()) as {
      conversations: ConversationSummary[];
    };
    setConversations(data.conversations);
  }

  return (
    <section className="grid gap-6 rounded-2xl border border-border bg-card p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-medium">Conversation logs</h2>
            <p className="text-sm text-muted-foreground">
              Review deployed chat and voice sessions.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={refreshList}
          >
            Refresh
          </Button>
        </div>

        <ul className="max-h-[480px] space-y-2 overflow-y-auto">
          {conversations.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
              No deployed conversations yet.
            </li>
          ) : (
            conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    selectedId === conversation.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <p className="font-medium capitalize">{conversation.mode}</p>
                  <p className="text-muted-foreground">
                    {new Date(conversation.createdAt).toLocaleString()} ·{" "}
                    {conversation.messageCount} messages
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="min-h-[320px] rounded-xl border border-border bg-muted/10 p-4">
        {!selectedId && (
          <p className="text-sm text-muted-foreground">
            Select a conversation to view messages.
          </p>
        )}

        {selectedId && loading && (
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        )}

        {detail && !loading && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {detail.conversation.visitorId
                ? `Visitor ${detail.conversation.visitorId}`
                : "Anonymous visitor"}
            </p>
            <div className="max-h-[420px] space-y-3 overflow-y-auto">
              {detail.messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium uppercase opacity-70">
                    {message.role}
                  </p>
                  {message.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
