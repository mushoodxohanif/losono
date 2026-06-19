import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="landing-mesh absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/80 p-10 text-center backdrop-blur-sm sm:p-16">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to build agents that{" "}
            <span className="landing-gradient-text">
              actually know your product
            </span>
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join developers shipping voice and chat agents with grounded,
            retrieval-augmented responses — in minutes, not months.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="/sign-in">
                Get started free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <Link href="/docs">View documentation</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
