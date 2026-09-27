// src/modules/dashboard/api/index.ts
import api from "@/lib/axios";
import type { IUserLog } from "@/types";
import type { MailStatistics } from "@/modules/mail/types";

/** Sections the caller can't read come back as null. */
export interface DashboardSummary {
  timeZone: string;
  users: { total: number; active: number } | null;
  mail: MailStatistics | null;
  activity: { ownOnly: boolean; days: { date: string; count: number }[] } | null;
  recentLogs: IUserLog[] | null;
}

/** One call for the whole dashboard; days split at local midnight in the browser's time zone. */
export const getDashboardSummary = (days: number) =>
  api.get<DashboardSummary>("/Dashboard/summary", {
    params: { days, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  });
