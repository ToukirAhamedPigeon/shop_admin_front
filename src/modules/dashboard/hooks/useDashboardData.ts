// src/modules/dashboard/hooks/useDashboardData.ts
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { addDays, endOfDay, startOfDay } from "date-fns";
import type { RootState } from "@/redux/store";
import type { IUserLog } from "@/types";
import type { MailStatistics } from "@/modules/mail/types";
import { getLogCount, getMailStatistics, getRecentLogs, getUserCount } from "../api";

/** `hidden` means the user lacks the permission, so the section isn't shown. */
export type Section<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error" }
  | { status: "hidden" };

export type ActivityDay = { date: Date; count: number };

export const ACTIVITY_DAYS = 14;

const loading = { status: "loading" } as const;
const hidden = { status: "hidden" } as const;

function load<T>(enabled: boolean, fetcher: () => Promise<T>, set: (s: Section<T>) => void, alive: () => boolean) {
  if (!enabled) {
    set(hidden);
    return;
  }
  set(loading);
  fetcher().then(
    (data) => {
      if (alive()) set({ status: "ready", data });
    },
    () => {
      if (alive()) set({ status: "error" });
    }
  );
}

export function useDashboardData() {
  const userId = useSelector((state: RootState) => state.auth.user?.id as string | undefined);
  const permissions = useSelector((state: RootState) => state.auth.user?.permissions as string[] | undefined);
  const has = (p: string) => !!permissions?.includes(p);

  const canUsers = has("read-admin-users");
  const canMail = has("read-admin-mails");
  const canLogs = has("read-admin-user-logs");
  // Without read-all, the log endpoints are scoped to the user's own actions,
  // matching the User Logs page.
  const ownLogsOnly = !has("read-admin-all-user-logs");

  const [users, setUsers] = useState<Section<number>>(loading);
  const [mail, setMail] = useState<Section<MailStatistics>>(loading);
  const [activity, setActivity] = useState<Section<ActivityDay[]>>(loading);
  const [recent, setRecent] = useState<Section<IUserLog[]>>(loading);

  useEffect(() => {
    let active = true;
    const alive = () => active;
    const createdBy = ownLogsOnly ? userId : undefined;

    load(canUsers, getUserCount, setUsers, alive);
    load(canMail, () => getMailStatistics().then((r) => r.data), setMail, alive);
    load(
      canLogs,
      () => {
        const today = startOfDay(new Date());
        const days = Array.from({ length: ACTIVITY_DAYS }, (_, i) => addDays(today, i - (ACTIVITY_DAYS - 1)));
        // One count per day keeps the totals exact however busy the log is.
        return Promise.all(
          days.map(async (date) => ({
            date,
            count: await getLogCount({ from: date, to: endOfDay(date), createdBy }),
          }))
        );
      },
      setActivity,
      alive
    );
    load(canLogs, () => getRecentLogs({ createdBy }), setRecent, alive);

    return () => {
      active = false;
    };
  }, [canUsers, canMail, canLogs, ownLogsOnly, userId]);

  return { users, mail, activity, recent, ownLogsOnly };
}
