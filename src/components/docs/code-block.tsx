import type { ReactNode } from "react";

type CodeBlockProps = {
  children: string;
  title?: string;
};

export function CodeBlock({ children, title }: CodeBlockProps) {
  return (
    <div className="space-y-2">
      {title ? (
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      ) : null}
      <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

type DocsSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  description?: string;
};

export function DocsSection({
  id,
  title,
  description,
  children,
}: DocsSectionProps) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type DocsSubsectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
};

export function DocsSubsection({ id, title, children }: DocsSubsectionProps) {
  return (
    <div id={id} className={id ? "scroll-mt-28 space-y-3" : "space-y-3"}>
      <h3 className="text-base font-medium">{title}</h3>
      {children}
    </div>
  );
}

export function DocsCard({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      {children}
    </div>
  );
}

export function DocsStepList({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal space-y-4 pl-5 text-sm text-muted-foreground">
      {children}
    </ol>
  );
}

export function DocsStep({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="space-y-2">
      <p className="font-medium text-foreground">{title}</p>
      <div className="space-y-2">{children}</div>
    </li>
  );
}
