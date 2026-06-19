import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, signIn } from "@/auth";
import { GoogleIcon } from "@/components/auth/google-icon";
import { Logo } from "@/components/brand/logo";
import { SectionEyebrow } from "@/components/landing/landing-header";
import { WaveformBars } from "@/components/landing/waveform-bars";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/dashboard" });
}

function SignInFallback() {
  return (
    <div className="h-[22rem] w-full animate-pulse rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm" />
  );
}

async function SignInContent({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl ?? "/dashboard");
  }

  const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

  return (
    <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-black/5 backdrop-blur-sm sm:p-8 lg:p-10">
      <div className="mb-6 space-y-3 text-center sm:mb-8 sm:space-y-4 lg:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-sm backdrop-blur-sm lg:hidden">
          <Logo
            variant="mark"
            href={null}
            markClassName="size-4"
            className="size-4"
          />
          <WaveformBars count={4} className="h-3.5 w-5" animated />
        </div>

        <div className="space-y-2">
          <SectionEyebrow className="lg:hidden">Get started</SectionEyebrow>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome to <span className="landing-gradient-text">Losono</span>
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Sign in to create voice and chat agents with a free trial account.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {googleEnabled ? (
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full rounded-xl border-border/60 bg-background/80 text-base backdrop-blur-sm hover:bg-muted/80"
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          </form>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Configure Google OAuth in your environment to enable sign-in.
          </p>
        )}

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to use Losono for building and deploying AI
          agents. No credit card required for the free trial.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border/40 pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
        <p className="text-sm text-muted-foreground">
          New to Losono?{" "}
          <Link
            href="/docs"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Read the docs
          </Link>
        </p>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/#pricing">View pricing</Link>
        </Button>
      </div>
    </div>
  );
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent searchParams={searchParams} />
    </Suspense>
  );
}
