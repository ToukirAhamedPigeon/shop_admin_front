import api from "@/lib/axios"
import { UserTableColumnSettingsApi, UserTableColumnSettingsUpdateApi } from "@/routes/api"

export const getTableColumnSettings = async (tableId: string, userId: string) => {
    const res = await api.get(UserTableColumnSettingsApi.url, {
      params: { tableId, userId },
      withCredentials: true
    })
    return res.data?.showColumnCombinations ?? []
}

export const updateTableColumnSettings = async (tableId: string, userId: string, showColumnCombinations: string[]) => {
  const res = await api.put(UserTableColumnSettingsUpdateApi.url, {
    tableId,
    userId,
    showColumnCombinations
  }, {
    withCredentials: true
  })
  return res
}