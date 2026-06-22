import Image from "next/image";
import { cn } from "@/lib/utils";

type WidgetLogoProps = {
  src: string;
  className?: string;
  width?: number;
  height?: number;
};

export function WidgetLogo({
  src,
  className,
  width = 32,
  height = 32,
}: WidgetLogoProps) {
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        className={cn(className)}
        aria-hidden
      />
    );
  }

  // Uploaded logos are stored as data URLs; next/image can't optimize those.
  return (
    // biome-ignore lint/performance/noImgElement: widget logos may be data URLs or unlisted external URLs
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      className={cn(className)}
      aria-hidden
    />
  );
}
