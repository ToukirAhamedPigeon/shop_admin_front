// Aceternity-style input frame: a radial glow tracks the cursor along the
// field's border while hovered and stays lit while the input has focus.
import { useState, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowFieldProps {
  children: ReactNode;
  className?: string;
  invalid?: boolean;
}

export function GlowField({ children, className, invalid }: GlowFieldProps) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  const color = invalid ? "var(--destructive)" : "var(--primary)";
  const glow = useMotionTemplate`radial-gradient(${hovered ? 140 : 0}px circle at ${x}px ${y}px, ${color}, transparent 80%)`;

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={reduceMotion ? undefined : { backgroundImage: glow }}
      className={cn(
        // bg colour is the resting border; the cursor glow is painted over it.
        "group/field relative rounded-lg p-px bg-input transition-[background-color,box-shadow] duration-200",
        "focus-within:bg-primary focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_18%,transparent)]",
        invalid && "bg-destructive/60 focus-within:bg-destructive focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--destructive)_18%,transparent)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
