// src/modules/dashboard/components/RecentActivity.tsx
import { formatDistanceToNow } from "date-fns";
import { History, Pencil, Plus, Trash2, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import type { IUserLog } from "@/types";
import type { Section } from "../hooks/useDashboardData";
import Panel from "./Panel";

const actionStyle: Record<string, { icon: LucideIcon; tone: string }> = {
  create: { icon: Plus, tone: "bg-success/10 text-success ring-success/20" },
  update: { icon: Pencil, tone: "bg-primary/10 text-primary ring-primary/20" },
  delete: { icon: Trash2, tone: "bg-destructive/10 text-destructive ring-destructive/20" },
};
const fallbackStyle = { icon: Zap, tone: "bg-muted text-muted-foreground ring-border" };

const safeDistance = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNow(date, { addSuffix: true });
};

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
        <ol className="relative space-y-1">
          {/* Timeline rail behind the icons. */}
          <span aria-hidden className="absolute bottom-5 left-[17px] top-5 w-px bg-border" />
          {section.data.map((log) => {
            const { icon: Icon, tone } = actionStyle[log.actionType?.toLowerCase()] ?? fallbackStyle;
            return (
              <li key={log.id} className="relative flex items-start gap-3 rounded-lg p-1.5 transition-colors duration-150 hover:bg-muted/50">
                <span className={cn("relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-card ring-1", tone)}>
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {log.detail || `${log.actionType} ${log.modelName}`}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <span className="capitalize">{log.actionType}</span>
                    {" · "}
                    {log.modelName}
                    {log.createdByName && <> · {log.createdByName}</>}
                    <span className="sm:hidden"> · {safeDistance(log.createdAt)}</span>
                  </p>
                </div>
                <time dateTime={log.createdAt} className="hidden shrink-0 pt-0.5 text-xs text-muted-foreground sm:block">
                  {safeDistance(log.createdAt)}
                </time>
              </li>
            );
          })}
        </ol>
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
