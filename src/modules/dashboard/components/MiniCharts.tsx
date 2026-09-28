// src/modules/dashboard/components/MiniCharts.tsx
// Small inline charts for the stat tiles. They take the colour of their parent
// (currentColor), so a tile's tone class colours them.
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "./dashboardMotion";

/** A tiny line of recent values, the last point marked. */
export function Sparkline({ values, label, width = 88, height = 32 }: { values: number[]; label: string; width?: number; height?: number }) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pad = 3;
  const x = (i: number) => pad + ((width - pad * 2) * i) / (values.length - 1);
  const y = (v: number) => height - pad - ((height - pad * 2) * v) / max;
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = `${line}L${x(values.length - 1)},${height}L${x(0)},${height}Z`;
  const last = values.length - 1;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <motion.path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      />
      <circle cx={x(last)} cy={y(values[last])} r={2.75} fill="currentColor" stroke="var(--card)" strokeWidth={1.5} />
    </svg>
  );
}

/** A small progress ring with the percentage in the middle. */
export function Ring({ value, label, size = 44 }: { value: number; label: string; size?: number }) {
  const reduceMotion = useReducedMotion();
  const pct = Math.max(0, Math.min(1, value));
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(pct * 100)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduceMotion ? c * (1 - pct) : c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-foreground">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}
