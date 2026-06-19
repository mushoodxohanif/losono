import type { PromptPreviewChunk } from "@/lib/prompts";
import { cn } from "@/lib/utils";

type PromptPreviewProps = {
  userPrompt: string;
  context: PromptPreviewChunk[];
  className?: string;
};

export function PromptPreview({
  userPrompt,
  context,
  className,
}: PromptPreviewProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <section className="space-y-2">
        <h3 className="text-sm font-medium">User prompt</h3>
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          {userPrompt.trim() ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {userPrompt}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No user prompt configured yet.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Retrieved context</h3>
          <span className="text-xs text-muted-foreground">
            {context.length} chunk{context.length === 1 ? "" : "s"}
          </span>
        </div>
        {context.length > 0 ? (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {context.map((chunk, index) => (
              <li
                key={`${index}-${chunk.content.slice(0, 24)}`}
                className="rounded-xl border border-border bg-card p-3"
              >
                <p className="mb-2 text-xs text-muted-foreground">
                  Chunk {index + 1} · {(chunk.similarity * 100).toFixed(0)}%
                  match
                </p>
                <p className="line-clamp-6 whitespace-pre-wrap text-sm">
                  {chunk.content}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            Send a message to retrieve relevant context from uploaded documents.
          </p>
        )}
      </section>
    </div>
  );
}
