// src/modules/dashboard/components/ActivityChart.tsx
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import type { ActivityDay, Section } from "../hooks/useDashboardData";
import { EASE } from "./dashboardMotion";
import Panel from "./Panel";

const HEIGHT = 220;
const PAD = { top: 14, right: 12, bottom: 26, left: 36 };

/** Rounds the axis top up to a clean step so ticks read 0 / 5 / 10 / 15. */
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { top: ticks, step: 1 };
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const clean = Math.max(1, Math.ceil(step));
  return { top: clean * ticks, step: clean };
}

/** Monotone cubic path (Fritsch–Carlson): smooth, but never overshoots below zero. */
function monotonePath(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 2) return "";
  const dx = pts.slice(1).map((p, i) => p.x - pts[i].x);
  const slope = pts.slice(1).map((p, i) => (p.y - pts[i].y) / dx[i]);
  const m = pts.map((_, i) =>
    i === 0 ? slope[0] : i === n - 1 ? slope[n - 2] : slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2
  );
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const tau = 3 / Math.sqrt(h);
      m[i] = tau * a * slope[i];
      m[i + 1] = tau * b * slope[i];
    }
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i].x + h},${pts[i].y + m[i] * h} ${pts[i + 1].x - h},${pts[i + 1].y - m[i + 1] * h} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export default function ActivityChart({ section, ownLogsOnly }: { section: Section<ActivityDay[]>; ownLogsOnly: boolean }) {
  const { t } = useTranslations();
  if (section.status === "hidden") return null;

  return (
    <Panel
      className="lg:col-span-2"
      title={t("dashboard.activity.title", "Activity")}
      subtitle={
        ownLogsOnly
          ? t("dashboard.activity.subtitleOwn", "Your actions over the last 14 days")
          : t("dashboard.activity.subtitle", "Actions across the system over the last 14 days")
      }
      to="/settings/user-logs"
      linkLabel={t("dashboard.viewLog", "View log")}
    >
      {section.status === "ready" ? (
        <Chart days={section.data} />
      ) : section.status === "error" ? (
        <p className="flex h-[272px] items-center justify-center text-sm text-muted-foreground">
          {t("dashboard.loadError", "Couldn't load this data.")}
        </p>
      ) : (
        <div className="h-[272px] animate-pulse rounded-lg bg-muted/60" aria-label="Loading" />
      )}
    </Panel>
  );
}

const RANGES = [7, 14] as const;

function Chart({ days: allDays }: { days: ActivityDay[] }) {
  const { t } = useTranslations();
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);
  const days = useMemo(() => allDays.slice(-range), [allDays, range]);
  const reduceMotion = useReducedMotion();
  const gradientId = useId();
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const thisWeek = allDays.slice(-7).reduce((s, d) => s + d.count, 0);
  const lastWeek = allDays.slice(-14, -7).reduce((s, d) => s + d.count, 0);
  const total = days.reduce((s, d) => s + d.count, 0);
  const busiest = days.reduce((best, d) => (d.count > best.count ? d : best), days[0]);
  const quietDays = days.filter((d) => d.count === 0).length;
  const change = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

  const geo = useMemo(() => {
    if (!width) return null;
    const max = Math.max(...days.map((d) => d.count));
    const { top, step } = niceScale(max);
    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (innerW * i) / (days.length - 1);
    const y = (v: number) => PAD.top + innerH - (innerH * v) / top;
    const pts = days.map((d, i) => ({ x: x(i), y: y(d.count) }));
    const line = monotonePath(pts);
    const area = `${line}L${pts[pts.length - 1].x},${y(0)}L${pts[0].x},${y(0)}Z`;
    const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
    return { pts, line, area, ticks, y, x };
  }, [days, width]);

  const pickIndex = (clientX: number, rect: DOMRect) => {
    const innerW = rect.width - PAD.left - PAD.right;
    const i = Math.round(((clientX - rect.left - PAD.left) / innerW) * (days.length - 1));
    return Math.min(days.length - 1, Math.max(0, i));
  };
  const onPointerMove = (e: PointerEvent<SVGRectElement>) =>
    setActive(pickIndex(e.clientX, (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()));
  const onKeyDown = (e: KeyboardEvent<SVGRectElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? -1 : 1;
    setActive((i) => Math.min(days.length - 1, Math.max(0, (i ?? days.length - 1) + step)));
  };

  const last = days.length - 1;
  // Roughly 56px per date label, so narrow charts skip more days.
  const labelEvery = days.length <= 7 && width / days.length >= 48 ? 1 : width && width / days.length < 56 ? 3 : 2;
  const shown = active;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl font-semibold tracking-tight text-foreground">{thisWeek.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{t("dashboard.activity.thisWeek", "actions in the last 7 days")}</p>
          {change !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                change > 0 ? "bg-success/10 text-success" : change < 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
              )}
            >
              {change > 0 ? <ArrowUpRight className="size-3.5" /> : change < 0 ? <ArrowDownRight className="size-3.5" /> : <Minus className="size-3.5" />}
              {change > 0 ? "+" : ""}
              {change}% {t("dashboard.activity.vsPrev", "vs previous 7 days")}
            </span>
          )}
        </div>
        <div role="group" aria-label={t("dashboard.activity.range", "Range")} className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => {
                setActive(null);
                setRange(r);
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                range === r ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r} {t("dashboard.activity.days", "days")}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="relative" style={{ height: HEIGHT }}>
        {geo && (
          <svg width={width} height={HEIGHT} className="block overflow-visible" role="img" aria-label={t("dashboard.activity.title", "Activity")}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {geo.ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={geo.y(v)} y2={geo.y(v)} className="stroke-border" strokeWidth={1} />
                <text x={PAD.left - 8} y={geo.y(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                  {v.toLocaleString()}
                </text>
              </g>
            ))}

            {days.map((d, i) =>
              i % labelEvery === last % labelEvery ? (
                <text key={i} x={geo.x(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {i === last ? t("dashboard.today", "Today") : format(d.date, "d MMM")}
                </text>
              ) : null
            )}

            <motion.path
              d={geo.area}
              fill={`url(#${gradientId})`}
              initial={{ opacity: reduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
            <motion.path
              d={geo.line}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduceMotion ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
            />

            {shown !== null && (
              <line
                x1={geo.pts[shown].x}
                x2={geo.pts[shown].x}
                y1={PAD.top}
                y2={geo.y(0)}
                className="stroke-muted-foreground/40"
                strokeWidth={1}
              />
            )}
            {/* End dot on today, or on the hovered day. */}
            <circle
              cx={geo.pts[shown ?? last].x}
              cy={geo.pts[shown ?? last].y}
              r={4.5}
              fill="var(--primary)"
              stroke="var(--card)"
              strokeWidth={2}
            />

            <rect
              x={PAD.left}
              y={PAD.top}
              width={Math.max(0, width - PAD.left - PAD.right)}
              height={HEIGHT - PAD.top - PAD.bottom}
              fill="transparent"
              tabIndex={0}
              className="cursor-crosshair outline-none focus-visible:stroke-ring"
              aria-label={t("dashboard.activity.explore", "Use the arrow keys to step through days")}
              onPointerMove={onPointerMove}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(last)}
              onBlur={() => setActive(null)}
              onKeyDown={onKeyDown}
            />
          </svg>
        )}

        {geo && shown !== null && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md"
            style={{
              left: Math.min(Math.max(geo.pts[shown].x, 70), width - 70),
              top: geo.pts[shown].y - 12,
            }}
          >
            <p className="text-sm font-semibold text-popover-foreground">
              {days[shown].count.toLocaleString()} {t("dashboard.activity.actions", "actions")}
            </p>
            <p className="text-muted-foreground">{format(days[shown].date, "EEE, d MMM")}</p>
          </div>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
        {[
          { label: t("dashboard.activity.total", "Total"), value: total.toLocaleString() },
          { label: t("dashboard.activity.average", "Daily average"), value: (total / days.length).toFixed(1) },
          {
            label: t("dashboard.activity.busiest", "Busiest day"),
            value: busiest && busiest.count > 0 ? format(busiest.date, "d MMM") : "—",
            hint: busiest && busiest.count > 0 ? `${busiest.count.toLocaleString()} ${t("dashboard.activity.actions", "actions")}` : undefined,
          },
        ].map(({ label, value, hint }) => (
          <div key={label} className="min-w-0">
            <dt className="truncate text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">
              {value}
              {hint && <span className="block text-xs font-normal text-muted-foreground sm:ml-1.5 sm:inline sm:text-sm">{hint}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {quietDays > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {quietDays} {quietDays === 1 ? t("dashboard.activity.quietDay", "day with no activity") : t("dashboard.activity.quietDays", "days with no activity")}
        </p>
      )}

      {/* The same numbers as a table, for screen readers. */}
      <table className="sr-only">
        <caption>{t("dashboard.activity.title", "Activity")}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date.toISOString()}>
              <td>{format(d.date, "d MMM yyyy")}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

