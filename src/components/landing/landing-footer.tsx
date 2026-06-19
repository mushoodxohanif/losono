import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { CopyrightYear } from "@/components/landing/copyright-year";

function CopyrightFallback() {
  return "2026";
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Multi-agent voice and chat platform with RAG, embeddings, and
            deployment tools.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link
            href="#features"
            className="transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            href="/sign-in"
            className="transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-border/40 py-6">
        <p className="text-center text-xs text-muted-foreground">
          ©{" "}
          <Suspense fallback={<CopyrightFallback />}>
            <CopyrightYear />
          </Suspense>{" "}
          Losono. Built with Gemini & Neon.
        </p>
      </div>
    </footer>
  );
}
