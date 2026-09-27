// Aceternity-style meteors: thin streaks that occasionally cross the area.
import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MeteorsProps {
  count?: number;
  className?: string;
}

export function Meteors({ count = 10, className }: MeteorsProps) {
  const reduceMotion = useReducedMotion();

  // Positions and timings are fixed per mount so meteors don't jump on re-render.
  const meteors = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: `${Math.round(Math.random() * 110 - 5)}%`,
        top: `${Math.round(Math.random() * 40 - 20)}%`,
        delay: `${(Math.random() * 12).toFixed(2)}s`,
        duration: `${(6 + Math.random() * 6).toFixed(2)}s`,
      })),
    [count]
  );

  if (reduceMotion) return null;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {meteors.map((m, i) => (
        <span
          key={i}
          className="aceternity-meteor"
          style={{ left: m.left, top: m.top, animationDelay: m.delay, animationDuration: m.duration }}
        />
      ))}
    </div>
  );
}
