// Motion presets shared by the public pages (see AuthKit.tsx).
import { useAnimationControls, useReducedMotion, type Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Staggers the direct children of AuthCard. */
export const authContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

/** Stagger item for direct children of AuthCard. */
export const authItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Card shake for failed submissions (disabled under reduced motion). */
export function useShake() {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const nudge = () => {
    if (!reduceMotion) controls.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
  };
  return { controls, nudge };
}
