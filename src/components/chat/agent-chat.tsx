"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, Send } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PromptPreviewChunk } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import { PromptPreview } from "./prompt-preview";

type LosonoChatData = {
  retrievedContext: {
    preview: {
      userPrompt: string;
      context: PromptPreviewChunk[];
    };
  };
};

type LosonoUIMessage = UIMessage<unknown, LosonoChatData>;

type AgentChatProps = {
  agentId: string;
  agentName: string;
  userPrompt: string;
};

function getMessageText(message: LosonoUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function AgentChat({ agentId, agentName, userPrompt }: AgentChatProps) {
  const conversationIdRef = useRef<string | undefined>(undefined);
  const [input, setInput] = useState("");
  const [retrievedContext, setRetrievedContext] = useState<
    PromptPreviewChunk[]
  >([]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<LosonoUIMessage>({
        api: `/api/agents/${agentId}/chat`,
        body: () => ({
          conversationId: conversationIdRef.current,
          mode: "playground",
        }),
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          const conversationId = response.headers.get("X-Conversation-Id");
          if (conversationId) {
            conversationIdRef.current = conversationId;
          }
          return response;
        },
      }),
    [agentId],
  );

  const { messages, sendMessage, status, error } = useChat<LosonoUIMessage>({
    transport,
    onData: (part) => {
      if (part.type === "data-retrievedContext") {
        setRetrievedContext(part.data.preview.context);
      }
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isBusy) {
      return;
    }

    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-[560px] flex-col rounded-2xl border border-border bg-card">
        <header className="border-b border-border px-4 py-3">
          <h2 className="font-medium">Chat with {agentName}</h2>
          <p className="text-sm text-muted-foreground">
            Test your agent with streaming responses and live RAG retrieval.
          </p>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Ask a question to test how your agent uses its prompt and uploaded
              context.
            </div>
          ) : (
            messages.map((message) => {
              const text = getMessageText(message);
              if (!text) {
                return null;
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {text}
                </div>
              );
            })
          )}

          {isBusy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 border-t border-border p-4"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a test message…"
            rows={2}
            className="min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button
            type="submit"
            disabled={isBusy || !input.trim()}
            size="icon-lg"
          >
            <Send />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </section>

      <aside className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4 space-y-1">
          <h2 className="font-medium">Prompt preview</h2>
          <p className="text-sm text-muted-foreground">
            User prompt and retrieved context only — master prompt is never
            shown.
          </p>
        </div>
        <PromptPreview userPrompt={userPrompt} context={retrievedContext} />
      </aside>
    </div>
  );
}
