"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

const SCROLL_THRESHOLD = 32;

type FloatingNavbarProps = {
  isAuthenticated?: boolean;
};

export function FloatingNavbar({
  isAuthenticated = false,
}: FloatingNavbarProps) {
  const pathname = usePathname();
  const isSignIn = pathname === "/sign-in";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6">
      <div
        className={cn(
          "pointer-events-auto flex w-full items-center justify-between rounded-full border border-border/60 bg-background/20 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl transition-[max-width,padding-inline,box-shadow] duration-500 ease-in-out motion-reduce:transition-none sm:py-3",
          scrolled
            ? "max-w-3xl px-3 shadow-md sm:px-4"
            : "max-w-6xl px-4 sm:px-6",
        )}
      >
        <div className="w-[187px]">
          <Logo priority className="h-10" />
        </div>
        <nav
          className={cn(
            "hidden items-center gap-0.5 md:flex",
            scrolled && "gap-0",
          )}
        >
          {navLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full transition-[padding] duration-500",
                scrolled ? "px-2.5" : "px-3",
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 w-[187px]">
          <ModeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full md:hidden"
          >
            <Link href="/docs">Docs</Link>
          </Button>
          {!isSignIn ? (
            isAuthenticated ? (
              <Button
                asChild
                size="sm"
                className={cn("rounded-full", scrolled && "px-3.5")}
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    "hidden rounded-full sm:inline-flex",
                    scrolled && "px-3",
                  )}
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn("rounded-full", scrolled && "px-3.5")}
                >
                  <Link href="/sign-in">Get started</Link>
                </Button>
              </>
            )
          ) : null}
        </div>
      </div>
    </header>
  );
}
