import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "mark";
  href?: string | null;
  className?: string;
  markClassName?: string;
  priority?: boolean;
};

export function Logo({
  variant = "full",
  href = "/",
  className,
  markClassName,
  priority = false,
}: LogoProps) {
  const mark = (
    <Image
      src="/logo-mark.svg"
      alt=""
      width={32}
      height={32}
      priority={priority}
      className={cn("size-8 shrink-0", markClassName)}
      aria-hidden
    />
  );

  const content =
    variant === "mark" ? (
      mark
    ) : (
      <span className="inline-flex items-center gap-2.5">
        {mark}
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Losono
        </span>
      </span>
    );

  if (href === null) {
    return (
      <span
        role="img"
        className={cn("inline-flex items-center", className)}
        aria-label="Losono"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href ?? "/"}
      className={cn(
        "inline-flex items-center rounded-md transition-opacity hover:opacity-80",
        className,
      )}
      aria-label="Losono home"
    >
      {content}
    </Link>
  );
}
