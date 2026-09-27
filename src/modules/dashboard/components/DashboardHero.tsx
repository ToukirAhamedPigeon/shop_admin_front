// src/modules/dashboard/components/DashboardHero.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Activity, CalendarDays, Mail, UserCog, Users, type LucideIcon } from "lucide-react";
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

export default function DashboardHero({ user }: { user: User | null }) {
  const { t } = useTranslations();
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
                src={user?.profileImage ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : undefined}
                alt=""
              />
              <AvatarFallback className="bg-primary/20 text-base font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {format(now, "EEEE, d MMMM yyyy")}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">
                {t(gKey, gFallback)}, <span className="dash-hero-name">{firstName}</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.subtitle", "Here's what's happening across your workspace.")}
              </p>
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
