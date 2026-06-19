"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
      />
    );
  }

  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
    />
  );
}
