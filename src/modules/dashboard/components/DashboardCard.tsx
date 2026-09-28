// src/modules/dashboard/components/DashboardCard.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section } from "../hooks/useDashboardData";
import CountUp from "./CountUp";
import { dashItem } from "./dashboardMotion";

const tones = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  info: "bg-info/10 text-info ring-info/15",
  success: "bg-success/10 text-success ring-success/15",
  warning: "bg-warning/10 text-warning ring-warning/20",
};

interface DashboardCardProps {
  title: string;
  section: Section<number>;
  icon: LucideIcon;
  caption?: ReactNode;
  tone?: keyof typeof tones;
  to?: string;
  /** A small chart beside the number (sparkline, ring). Coloured by the tile's tone. */
  aside?: ReactNode;
}

/** Stat tile: label, icon, animated value and a caption. The whole tile links when `to` is set. */
export default function DashboardCard({ title, section, icon: Icon, caption, tone = "primary", to, aside }: DashboardCardProps) {
  const body = (
    <>
      {/* Soft corner glow in the tile's tone, brighter on hover. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-90",
          tones[tone].split(" ")[0]
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg ring-1", tones[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="relative mt-3 flex min-h-11 items-end justify-between gap-3">
        <div className="text-[28px] font-semibold leading-none tracking-tight text-foreground">
          {section.status === "ready" ? (
            <CountUp value={section.data} />
          ) : section.status === "error" ? (
            <span className="text-muted-foreground" title="Couldn't load">
              —
            </span>
          ) : (
            <span className="block h-7 w-20 animate-pulse rounded-md bg-muted" aria-label="Loading" />
          )}
        </div>
        {section.status === "ready" && aside && <div className={tones[tone].split(" ")[1]}>{aside}</div>}
      </div>
      <div className="relative mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{caption}</span>
        {to && (
          <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
        )}
      </div>
    </>
  );

  const cls =
    "group relative block h-full overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <motion.div variants={dashItem} className="h-full">
      {to ? (
        <Link to={to} className={cls}>
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </motion.div>
  );
}
