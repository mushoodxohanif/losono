import { cn } from "@/lib/utils";

type WaveformBarsProps = {
  className?: string;
  barClassName?: string;
  count?: number;
  animated?: boolean;
  spread?: boolean;
};

const HEIGHT_PATTERN = [
  40, 70, 100, 55, 85, 60, 90, 45, 65, 80, 50, 95,
] as const;

function getBarHeight(index: number) {
  return HEIGHT_PATTERN[index % HEIGHT_PATTERN.length];
}

function getBarDelay(index: number) {
  return `${((index * 0.1) % 1.4).toFixed(2)}s`;
}

export function WaveformBars({
  className,
  barClassName,
  count = 5,
  animated = false,
  spread = false,
}: WaveformBarsProps) {
  const bars = Array.from({ length: count }, (_, index) => index);

  return (
    <div
      className={cn(
        "flex items-end justify-center",
        spread ? "w-full gap-px" : "gap-[3px]",
        className,
      )}
      aria-hidden
    >
      {bars.map((index) => (
        <span
          key={index}
          className={cn(
            "rounded-full bg-chart-2",
            spread ? "min-w-px flex-1 max-w-[2px]" : "w-[3px]",
            animated && "landing-wave-bar",
            barClassName,
          )}
          style={{
            height: `${getBarHeight(index)}%`,
            animationDelay: animated ? getBarDelay(index) : undefined,
          }}
        />
      ))}
    </div>
  );
}
