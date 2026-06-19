import { Suspense } from "react";
import { AuthBrandingPanel } from "@/components/auth/auth-branding-panel";
import { CopyrightYear } from "@/components/landing/copyright-year";

function CopyrightFallback() {
  return "2026";
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="landing-mesh fixed inset-0" aria-hidden />
      <div className="landing-grid-pattern fixed inset-0" aria-hidden />

      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto overscroll-contain px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-24">
        <div className="grid w-full max-w-5xl items-center gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-16">
          <AuthBrandingPanel />
          <div className="landing-fade-up landing-fade-up-delay-1 w-full">
            {children}
          </div>
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-border/40 py-3 sm:py-4">
        <p className="text-center text-xs text-muted-foreground">
          ©{" "}
          <Suspense fallback={<CopyrightFallback />}>
            <CopyrightYear />
          </Suspense>{" "}
          Losono. Built with Gemini & Neon.
        </p>
      </footer>
    </div>
  );
}
