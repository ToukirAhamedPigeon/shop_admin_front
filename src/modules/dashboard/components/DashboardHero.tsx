// src/modules/dashboard/components/DashboardHero.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Activity, CalendarDays, Mail, MailOpen, RefreshCw, UserCog, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { assetUrl } from "@/lib/assetUrl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "@/hooks/useTranslations";
import type { User } from "@/modules/auth/types";
import { dashItem } from "./dashboardMotion";

const greetingKey = (hour: number) =>
  hour < 12 ? ["dashboard.greeting.morning", "Good morning"] : hour < 17 ? ["dashboard.greeting.afternoon", "Good afternoon"] : ["dashboard.greeting.evening", "Good evening"];

type QuickAction = { to: string; label: string; icon: LucideIcon; permission: string };

// A small constellation echoing the login scene. Deterministic, so it doesn't
// jump between renders.
function useConstellation() {
  return useMemo(() => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const nodes = Array.from({ length: 26 }, () => ({ x: 40 + rand() * 560, y: 12 + rand() * 196, r: 1.2 + rand() * 1.8 }));
    const links: [number, number][] = [];
    nodes.forEach((a, i) => {
      nodes
        .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
        .filter(({ j }) => j > i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2)
        .forEach(({ j, d }) => {
          if (d < 150) links.push([i, j]);
        });
    });
    return { nodes, links };
  }, []);
}

interface HeroProps {
  user: User | null;
  /** null while loading or when the user can't read it. */
  unread: number | null;
  actionsToday: number | null;
  ownLogsOnly: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  updatedAt: Date | null;
}

/** "just now", "3 min ago": re-rendered every 30 s so it stays true. */
function useUpdatedLabel(updatedAt: Date | null) {
  const { t } = useTranslations();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!updatedAt) return null;
  const mins = Math.floor((Date.now() - updatedAt.getTime()) / 60_000);
  if (mins < 1) return t("dashboard.updatedNow", "Updated just now");
  return `${t("dashboard.updated", "Updated")} ${mins} ${t("dashboard.minAgo", "min ago")}`;
}

export default function DashboardHero({ user, unread, actionsToday, ownLogsOnly, onRefresh, refreshing, updatedAt }: HeroProps) {
  const { t } = useTranslations();
  const updatedLabel = useUpdatedLabel(updatedAt);
  const { nodes, links } = useConstellation();
  const now = new Date();
  const [gKey, gFallback] = greetingKey(now.getHours());
  const firstName = user?.name?.split(" ")[0] || "Admin";
  const permissions: string[] = user?.permissions ?? [];
  const initials = (user?.name ?? "A")
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const actions: QuickAction[] = [
    { to: "/mail", label: t("dashboard.action.mail", "Open mailbox"), icon: Mail, permission: "read-admin-mails" },
    { to: "/settings/users", label: t("dashboard.action.users", "Manage users"), icon: Users, permission: "read-admin-users" },
    { to: "/settings/user-logs", label: t("dashboard.action.logs", "Activity log"), icon: Activity, permission: "read-admin-user-logs" },
    { to: "/settings/profile", label: t("dashboard.action.profile", "Edit profile"), icon: UserCog, permission: "update-admin-profile" },
  ].filter((a) => permissions.includes(a.permission));

  return (
    // Always dark, like the login stage, so the brand reads the same in both themes.
    <motion.section variants={dashItem} className="dark">
      <div className="dash-hero relative overflow-hidden rounded-2xl border border-white/10 text-foreground shadow-lg">
        <svg
          aria-hidden
          viewBox="0 0 640 220"
          preserveAspectRatio="xMaxYMid slice"
          className="dash-constellation pointer-events-none absolute inset-y-0 right-0 h-full w-full opacity-35 md:w-[70%] md:opacity-100"
        >
          {links.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              className="dash-link"
              style={{ animationDelay: `${(i * 0.37) % 6}s` }}
            />
          ))}
          {nodes.map((n, i) => (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={n.r}
              className="dash-node"
              style={{ animationDelay: `${(i * 0.53) % 5}s` }}
            />
          ))}
        </svg>

        <div className="relative flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 ring-2 ring-white/15 ring-offset-2 ring-offset-transparent">
              <AvatarImage
                src={assetUrl(user?.profileImage) ?? undefined}
                alt=""
              />
              <AvatarFallback className="bg-primary/20 text-base font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {format(now, "EEEE, d MMMM yyyy")}
                {updatedLabel && (
                  <>
                    <span aria-hidden>·</span>
                    <span aria-live="polite">{refreshing ? t("dashboard.refreshing", "Refreshing…") : updatedLabel}</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  aria-label={t("dashboard.refresh", "Refresh")}
                  title={t("dashboard.refresh", "Refresh")}
                  className="-my-1 ml-0.5 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-white/10 hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 disabled:opacity-60"
                >
                  <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
                </button>
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">
                {t(gKey, gFallback)}, <span className="dash-hero-name">{firstName}</span>
              </h1>
              {unread === null && actionsToday === null ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("dashboard.subtitle", "Here's what's happening across your workspace.")}
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {unread !== null && (
                    <Link
                      to="/mail"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-foreground transition-colors duration-150 hover:bg-white/10 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60"
                    >
                      <MailOpen className="size-3.5 text-warning" />
                      {unread === 0 ? (
                        t("dashboard.glance.noUnread", "No unread mail")
                      ) : (
                        <>
                          <span className="font-semibold tabular-nums">{unread.toLocaleString()}</span>
                          {unread === 1 ? t("dashboard.glance.unreadOne", "unread message") : t("dashboard.glance.unread", "unread messages")}
                        </>
                      )}
                    </Link>
                  )}
                  {actionsToday !== null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-foreground">
                      <Activity className="size-3.5 text-success" />
                      <span className="font-semibold tabular-nums">{actionsToday.toLocaleString()}</span>
                      {ownLogsOnly
                        ? t("dashboard.glance.actionsOwn", "actions by you today")
                        : actionsToday === 1
                          ? t("dashboard.glance.actionOne", "action today")
                          : t("dashboard.glance.actions", "actions today")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {actions.length > 0 && (
            <nav aria-label={t("dashboard.quickActions", "Quick actions")} className="flex flex-wrap gap-2">
              {actions.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors duration-150 hover:border-white/20 hover:bg-white/10 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </motion.section>
  );
}
