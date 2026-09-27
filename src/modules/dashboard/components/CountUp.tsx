// src/modules/dashboard/components/CountUp.tsx
import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

const format = (n: number) => Math.round(n).toLocaleString();

/** Counts up to `value` once it arrives; shows the final value with reduced motion. */
export default function CountUp({ value, duration = 0.9 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduceMotion) {
      node.textContent = format(value);
      return;
    }
    const from = Number(node.dataset.value ?? 0);
    const controls = animate(from, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    node.dataset.value = String(value);
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return (
    <span ref={ref} aria-label={format(value)}>
      {format(reduceMotion ? value : 0)}
    </span>
  );
}
