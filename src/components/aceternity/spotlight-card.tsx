// Aceternity-style card: a soft spotlight follows the cursor across the
// surface and a thin beam travels around the border.
import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Show the rotating border beam. */
  beam?: boolean;
}

export function SpotlightCard({ children, className, beam = true }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)`;

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        x.set(-400);
        y.set(-400);
      }}
      className={cn("group/spot relative rounded-2xl p-px", className)}
    >
      {/* Border: static hairline plus an optional travelling beam. */}
      <div aria-hidden className="absolute inset-0 rounded-2xl bg-border" />
      {beam && !reduceMotion && (
        <div aria-hidden className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="aceternity-beam absolute -inset-[100%]" />
        </div>
      )}

      <div className="relative h-full overflow-hidden rounded-[calc(1rem-1px)] bg-card/95 shadow-2xl backdrop-blur-xl">
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
            style={{ background: spotlight }}
          />
        )}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
