// src/modules/dashboard/hooks/useDashboardData.ts
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  // Only the newest request may update the page.
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setRefreshing(true);
    setState((prev) => (prev.status === "error" ? { status: "loading" } : prev));
    getDashboardSummary(ACTIVITY_DAYS).then(
      (res) => {
        if (id !== requestId.current) return;
        setState({ status: "ready", data: res.data });
        setUpdatedAt(new Date());
        setRefreshing(false);
      },
      () => {
        if (id !== requestId.current) return;
        // A failed refresh keeps what is on screen; only a failed first load shows errors.
        setState((prev) => (prev.status === "ready" ? prev : { status: "error" }));
        setRefreshing(false);
      }
    );
  }, []);

  // Leaving the page makes any reply in flight stale.
  const cancel = useCallback(() => {
    requestId.current++;
  }, []);

  useEffect(() => {
    load();
    return cancel;
  }, [load, cancel]);

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

  return { users, mail, activity, recent, ownLogsOnly, reload: load, refreshing, updatedAt, failed: state.status === "error" };
}
