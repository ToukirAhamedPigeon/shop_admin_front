// src/modules/dashboard/components/dashboardMotion.ts
import type { Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Staggers the dashboard sections in; children use `dashItem`. */
export const dashContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const dashItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};
