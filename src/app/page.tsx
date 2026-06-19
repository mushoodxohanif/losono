import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Logo priority />
        <nav className="flex items-center gap-3">
          <ModeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs">Docs</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </nav>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <Logo
              variant="mark"
              href={null}
              className="mx-auto size-16"
              markClassName="size-16"
            />
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Multi-agent voice + chat platform
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Build agents that speak and listen
            </h1>
            <p className="text-lg text-muted-foreground">
              Build, test, and deploy AI agents with chat, voice, and document
              context — powered by Gemini and Neon pgvector.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-in">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">View docs</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
