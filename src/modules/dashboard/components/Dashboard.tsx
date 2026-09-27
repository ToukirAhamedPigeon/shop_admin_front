// src/modules/dashboard/components/Dashboard.tsx
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Activity, Inbox, MailOpen, Users } from "lucide-react";
import type { RootState } from "@/redux/store";
import { useTranslations } from "@/hooks/useTranslations";
import { useDashboardData, type Section } from "../hooks/useDashboardData";
import DashboardHero from "./DashboardHero";
import DashboardCard from "./DashboardCard";
import ActivityChart from "./ActivityChart";
import MailBreakdown from "./MailBreakdown";
import RecentActivity from "./RecentActivity";
import AccountCard from "./AccountCard";
import { dashContainer } from "./dashboardMotion";

/** Derives a number from a loaded section, keeping its loading / error / hidden state. */
function pick<T>(section: Section<T>, fn: (data: T) => number): Section<number> {
  return section.status === "ready" ? { status: "ready", data: fn(section.data) } : section;
}

export default function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslations();
  const { users, mail, activity, recent, ownLogsOnly } = useDashboardData();

  const tiles = [
    {
      title: t("dashboard.stat.users", "Total users"),
      section: users,
      icon: Users,
      tone: "primary" as const,
      caption: t("dashboard.stat.usersCaption", "Active accounts"),
      to: "/settings/users",
    },
    {
      title: t("dashboard.stat.received", "Mail received"),
      section: pick(mail, (m) => m.totalReceived),
      icon: Inbox,
      tone: "info" as const,
      caption: t("dashboard.stat.receivedCaption", "All time"),
      to: "/mail",
    },
    {
      title: t("dashboard.stat.unread", "Unread mail"),
      section: pick(mail, (m) => m.unreadCount),
      icon: MailOpen,
      tone: "warning" as const,
      caption: t("dashboard.stat.unreadCaption", "Waiting for you"),
      to: "/mail",
    },
    {
      title: t("dashboard.stat.today", "Actions today"),
      section: pick(activity, (days) => days[days.length - 1]?.count ?? 0),
      icon: Activity,
      tone: "success" as const,
      caption: ownLogsOnly
        ? t("dashboard.stat.todayOwn", "By you")
        : t("dashboard.stat.todayCaption", "Across the system"),
      to: "/settings/user-logs",
    },
  ].filter((tile) => tile.section.status !== "hidden");

  return (
    <motion.div variants={dashContainer} initial="hidden" animate="show" className="space-y-6">
      <DashboardHero user={user} />

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
