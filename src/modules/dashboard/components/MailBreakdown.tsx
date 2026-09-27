// src/modules/dashboard/components/MailBreakdown.tsx
import { motion, useReducedMotion } from "framer-motion";
import { Inbox, MailOpen, Send, Star, Trash2, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import type { MailStatistics } from "@/modules/mail/types";
import type { Section } from "../hooks/useDashboardData";
import { EASE } from "./dashboardMotion";
import Panel from "./Panel";

type Row = { key: keyof MailStatistics; label: string; icon: LucideIcon };

export default function MailBreakdown({ section }: { section: Section<MailStatistics> }) {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion();
  if (section.status === "hidden") return null;

  const rows: Row[] = [
    { key: "totalReceived", label: t("dashboard.mail.received", "Received"), icon: Inbox },
    { key: "totalSent", label: t("dashboard.mail.sent", "Sent"), icon: Send },
    { key: "unreadCount", label: t("dashboard.mail.unread", "Unread"), icon: MailOpen },
    { key: "starredCount", label: t("dashboard.mail.starred", "Starred"), icon: Star },
    { key: "trashCount", label: t("dashboard.mail.trash", "Trash"), icon: Trash2 },
  ];

  return (
    <Panel
      title={t("dashboard.mail.title", "Mailbox")}
      subtitle={t("dashboard.mail.subtitle", "Messages by folder")}
      to="/mail"
      linkLabel={t("dashboard.open", "Open")}
    >
      {section.status === "ready" ? (
        (() => {
          const max = Math.max(1, ...rows.map((r) => section.data[r.key] ?? 0));
          return (
            <ul className="space-y-4">
              {rows.map(({ key, label, icon: Icon }, i) => {
                const value = section.data[key] ?? 0;
                return (
                  <li key={key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="size-4" />
                        {label}
                      </span>
                      <span className="font-medium tabular-nums text-foreground">{value.toLocaleString()}</span>
                    </div>
                    {/* One hue: these are magnitudes of the same thing. */}
                    <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: reduceMotion ? `${(value / max) * 100}%` : 0 }}
                        animate={{ width: `${(value / max) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.15 + i * 0.05, ease: EASE }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })()
      ) : section.status === "error" ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("dashboard.loadError", "Couldn't load this data.")}</p>
      ) : (
        <div className="space-y-5" aria-label="Loading">
          {rows.map((r) => (
            <div key={r.key} className="space-y-2">
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-2 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
