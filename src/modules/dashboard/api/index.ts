// src/modules/dashboard/api/index.ts
// Thin wrappers over existing list endpoints. The API has no dedicated
// dashboard endpoint, so counts come from `totalCount` with `limit: 1`.
import api from "@/lib/axios";
import type { IUserLog } from "@/types";

export { getMailStatistics } from "@/modules/mail/api";

export const getUserCount = async (): Promise<number> => {
  const res = await api.post("/users", { page: 1, limit: 1, isDeletedStr: "false" });
  return Number(res.data?.grandTotalCount ?? res.data?.totalCount ?? 0);
};

type LogQuery = {
  from?: Date;
  to?: Date;
  /** Limit to one user's logs (users without read-all-logs permission). */
  createdBy?: string;
};

const logPayload = ({ from, to, createdBy }: LogQuery, limit: number) => ({
  page: 1,
  limit,
  sortBy: "createdAt",
  sortOrder: "desc",
  ...(from && { createdAtFrom: from }),
  ...(to && { createdAtTo: to }),
  ...(createdBy && { createdBy: [createdBy] }),
});

export const getLogCount = async (query: LogQuery): Promise<number> => {
  const res = await api.post("/UserLog", logPayload(query, 1));
  return Number(res.data?.totalCount ?? 0);
};

export const getRecentLogs = async (query: LogQuery, limit = 6): Promise<IUserLog[]> => {
  const res = await api.post("/UserLog", logPayload(query, limit));
  return (res.data?.logs ?? []) as IUserLog[];
};
