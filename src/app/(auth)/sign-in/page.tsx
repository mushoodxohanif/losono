import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth, signIn } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/dashboard" });
}

function SignInFallback() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="h-64 w-full max-w-md animate-pulse rounded-2xl border border-border bg-muted/40" />
    </main>
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
    <main className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-4 text-center">
          <Logo className="mx-auto w-fit" priority />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Create voice and chat agents with a free trial account.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {googleEnabled ? (
            <form action={signInWithGoogle}>
              <Button type="submit" className="w-full" variant="outline">
                Continue with Google
              </Button>
            </form>
          ) : (
            <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Configure Google OAuth in your environment to enable sign-in.
            </p>
          )}
        </div>
      </div>
    </main>
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
