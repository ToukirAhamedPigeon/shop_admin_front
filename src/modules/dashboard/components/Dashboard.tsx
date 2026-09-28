// src/modules/dashboard/components/Dashboard.tsx
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Inbox, MailOpen, RefreshCw, Users } from "lucide-react";
import type { RootState } from "@/redux/store";
import { useTranslations } from "@/hooks/useTranslations";
import { useDashboardData, type Section } from "../hooks/useDashboardData";
import DashboardHero from "./DashboardHero";
import DashboardCard from "./DashboardCard";
import ActivityChart from "./ActivityChart";
import MailBreakdown from "./MailBreakdown";
import RecentActivity from "./RecentActivity";
import AccountCard from "./AccountCard";
import { dashContainer, dashItem } from "./dashboardMotion";
import { Ring, Sparkline } from "./MiniCharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Derives a number from a loaded section, keeping its loading / error / hidden state. */
function pick<T>(section: Section<T>, fn: (data: T) => number): Section<number> {
  return section.status === "ready" ? { status: "ready", data: fn(section.data) } : section;
}

export default function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslations();
  const { users, mail, activity, recent, ownLogsOnly, reload, refreshing, updatedAt, failed } = useDashboardData();

  const days = activity.status === "ready" ? activity.data : [];
  const today = days[days.length - 1]?.count ?? 0;
  const yesterday = days[days.length - 2]?.count ?? 0;
  const diff = today - yesterday;

  const tiles = [
    {
      title: t("dashboard.stat.users", "Total users"),
      section: pick(users, (u) => u.total),
      icon: Users,
      tone: "primary" as const,
      caption:
        users.status === "ready"
          ? `${users.data.active.toLocaleString()} ${t("dashboard.stat.usersActive", "active")}`
          : t("dashboard.stat.usersCaption", "Registered accounts"),
      aside:
        users.status === "ready" && users.data.total > 0 ? (
          <Ring value={users.data.active / users.data.total} label={t("dashboard.stat.activeShare", "Active accounts")} />
        ) : null,
      to: "/settings/users",
    },
    {
      title: t("dashboard.stat.received", "Mail received"),
      section: pick(mail, (m) => m.totalReceived),
      icon: Inbox,
      tone: "info" as const,
      caption:
        mail.status === "ready"
          ? `${mail.data.totalSent.toLocaleString()} ${t("dashboard.stat.sent", "sent")} · ${t("dashboard.stat.receivedCaption", "All time")}`
          : t("dashboard.stat.receivedCaption", "All time"),
      to: "/mail",
    },
    {
      title: t("dashboard.stat.unread", "Unread mail"),
      section: pick(mail, (m) => m.unreadCount),
      icon: MailOpen,
      tone: "warning" as const,
      caption:
        mail.status === "ready" && mail.data.unreadCount === 0
          ? t("dashboard.stat.inboxZero", "All caught up")
          : t("dashboard.stat.unreadCaption", "Waiting for you"),
      aside:
        mail.status === "ready" && mail.data.totalReceived > 0 ? (
          <Ring value={1 - mail.data.unreadCount / mail.data.totalReceived} label={t("dashboard.stat.readShare", "Read")} />
        ) : null,
      to: "/mail",
    },
    {
      title: t("dashboard.stat.today", "Actions today"),
      section: pick(activity, (days) => days[days.length - 1]?.count ?? 0),
      icon: Activity,
      tone: "success" as const,
      caption:
        days.length > 1 ? (
          <span className={cn(diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : undefined)}>
            {diff > 0 ? "+" : ""}
            {diff} {t("dashboard.stat.vsYesterday", "vs yesterday")}
            <span className="text-muted-foreground">
              {" · "}
              {ownLogsOnly ? t("dashboard.stat.todayOwn", "By you") : t("dashboard.stat.todayCaption", "Across the system")}
            </span>
          </span>
        ) : ownLogsOnly ? (
          t("dashboard.stat.todayOwn", "By you")
        ) : (
          t("dashboard.stat.todayCaption", "Across the system")
        ),
      aside: days.length > 1 ? <Sparkline values={days.slice(-7).map((d) => d.count)} label={t("dashboard.stat.last7", "Last 7 days")} /> : null,
      to: "/settings/user-logs",
    },
  ].filter((tile) => tile.section.status !== "hidden");

  return (
    <motion.div variants={dashContainer} initial="hidden" animate="show" className="space-y-6">
      <DashboardHero
        user={user}
        unread={mail.status === "ready" ? mail.data.unreadCount : null}
        actionsToday={activity.status === "ready" ? today : null}
        ownLogsOnly={ownLogsOnly}
        onRefresh={reload}
        refreshing={refreshing}
        updatedAt={updatedAt}
      />

      {failed && (
        <motion.div
          variants={dashItem}
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
        >
          <AlertTriangle className="size-4 shrink-0 text-destructive" />
          <p className="mr-auto text-sm text-foreground">{t("dashboard.loadErrorAll", "The dashboard couldn't be loaded.")}</p>
          <Button size="sm" variant="outline" onClick={reload} disabled={refreshing}>
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            {t("common.tryAgain", "Try again")}
          </Button>
        </motion.div>
      )}

      {tiles.length > 0 && (
        <motion.div variants={dashContainer} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
            <DashboardCard key={tile.title} {...tile} />
          ))}
        </motion.div>
      )}

      <motion.div variants={dashContainer} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActivityChart section={activity} ownLogsOnly={ownLogsOnly} />
        <MailBreakdown section={mail} />
        <RecentActivity section={recent} />
        <AccountCard user={user} />
      </motion.div>
    </motion.div>
  );
}
