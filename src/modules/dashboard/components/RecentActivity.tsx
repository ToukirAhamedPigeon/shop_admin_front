// src/modules/dashboard/components/RecentActivity.tsx
import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { History } from "lucide-react";
import { actionOf, isSessionAction, toneSoft } from "@/modules/settings/user-logs/components/logMeta";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import type { IUserLog } from "@/types";
import type { Section } from "../hooks/useDashboardData";
import Panel from "./Panel";

const parse = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};
const safeTime = (iso: string) => {
  const d = parse(iso);
  if (!d) return "";
  return Date.now() - d.getTime() < 60 * 60_000 ? formatDistanceToNowStrict(d, { addSuffix: true }) : format(d, "h:mm a");
};
const safeDate = (iso: string) => {
  const d = parse(iso);
  return d ? format(d, "PPpp") : "";
};

/** Newest first, split into Today / Yesterday / a date. */
function groupByDay(logs: IUserLog[]) {
  const groups: { key: string; label: string; items: IUserLog[] }[] = [];
  for (const log of logs) {
    const d = parse(log.createdAt);
    const key = d ? format(d, "yyyy-MM-dd") : "unknown";
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const label = !d ? "Unknown date" : isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "EEEE, d MMM");
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(log);
  }
  return groups;
}

export default function RecentActivity({ section }: { section: Section<IUserLog[]> }) {
  const { t } = useTranslations();
  if (section.status === "hidden") return null;

  return (
    <Panel
      className="lg:col-span-2"
      title={t("dashboard.recent.title", "Recent activity")}
      subtitle={t("dashboard.recent.subtitle", "The latest changes, newest first")}
      to="/settings/user-logs"
      linkLabel={t("dashboard.viewAll", "View all")}
    >
      {section.status === "ready" && section.data.length > 0 && (
        <div className="space-y-4">
          {groupByDay(section.data).map((group) => (
            <section key={group.key} aria-label={group.label}>
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t(group.label)}</h3>
              <ol className="relative space-y-0.5">
                {/* Timeline rail behind the icons. */}
                {group.items.length > 1 && <span aria-hidden className="absolute bottom-5 left-[19px] top-5 w-px bg-border" />}
                {group.items.map((log) => {
                  const action = actionOf(log.actionType);
                  const Icon = action.icon;
                  return (
                    <li key={log.id} className="relative flex items-start gap-3 rounded-lg p-1.5 transition-colors duration-150 hover:bg-muted/50">
                      {/* Opaque base under the soft tint so the rail doesn't show through. */}
                      <span className="relative mt-0.5 size-7 shrink-0 rounded-full bg-card">
                        <span className={cn("flex size-full items-center justify-center rounded-full", toneSoft[action.tone])}>
                          <Icon className="size-3.5" />
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{log.createdByName || t("Someone")}</span> {t(action.verb)}
                          {!isSessionAction(log.actionType) && log.modelName && (
                            <>
                              {" "}
                              <span className="font-medium text-foreground">{log.modelName}</span>
                            </>
                          )}
                        </p>
                        {log.detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{log.detail}</p>}
                      </div>
                      <time
                        dateTime={log.createdAt}
                        title={safeDate(log.createdAt)}
                        className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground"
                      >
                        {safeTime(log.createdAt)}
                      </time>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
      {section.status === "ready" && section.data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <History className="size-5" />
          </span>
          <p className="text-sm text-muted-foreground">{t("dashboard.recent.empty", "No activity yet.")}</p>
        </div>
      )}
      {section.status === "error" && (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("dashboard.loadError", "Couldn't load this data.")}</p>
      )}
      {section.status === "loading" && (
        <div className="space-y-3" aria-label="Loading">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-1.5">
              <div className="size-7 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
