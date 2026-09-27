// src/modules/dashboard/hooks/useDashboardData.ts
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import type { IUserLog } from "@/types";
import type { MailStatistics } from "@/modules/mail/types";
import { getDashboardSummary, type DashboardSummary } from "../api";

/** `hidden` means the user lacks the permission, so the section isn't shown. */
export type Section<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error" }
  | { status: "hidden" };

export type ActivityDay = { date: Date; count: number };
export type UsersSummary = { total: number; active: number };

export const ACTIVITY_DAYS = 14;

type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: DashboardSummary };

// "2026-09-27" is a local calendar date; `new Date(string)` would read it as UTC.
const localDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function useDashboardData() {
  const permissions = useSelector((state: RootState) => state.auth.user?.permissions as string[] | undefined);
  const has = (p: string) => !!permissions?.includes(p);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    getDashboardSummary(ACTIVITY_DAYS).then(
      (res) => {
        if (active) setState({ status: "ready", data: res.data });
      },
      () => {
        if (active) setState({ status: "error" });
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // While loading, local permissions decide what to show so sections don't
  // flash in and out; once loaded, the server's nulls are the source of truth.
  function section<T>(permission: string, pick: (s: DashboardSummary) => T | null): Section<T> {
    if (state.status !== "ready") return has(permission) ? state : { status: "hidden" };
    const data = pick(state.data);
    return data == null ? { status: "hidden" } : { status: "ready", data };
  }

  const users = section<UsersSummary>("read-admin-users", (s) => s.users);
  const mail = section<MailStatistics>("read-admin-mails", (s) => s.mail);
  const activity = section<ActivityDay[]>("read-admin-user-logs", (s) =>
    s.activity ? s.activity.days.map((d) => ({ date: localDate(d.date), count: d.count })) : null
  );
  const recent = section<IUserLog[]>("read-admin-user-logs", (s) => s.recentLogs);
  const ownLogsOnly =
    state.status === "ready" ? !!state.data.activity?.ownOnly : !has("read-admin-all-user-logs");

  return { users, mail, activity, recent, ownLogsOnly };
}
