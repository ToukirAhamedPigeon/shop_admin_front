import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

interface TableState {
  [key: string]: string[] // key: `${userId}:${tableId}`
}

export interface ColumnsPayload {
  key: string
  visibleIds: string[]
}

const initialState: TableState = {}

export const tableColumnSettingsSlice = createSlice({
  name: "tableColumnSettings",
  initialState,
  reducers: {
    setTableColumnSettings(state, action: PayloadAction<ColumnsPayload>) {
      const { key, visibleIds } = action.payload
      state[key] = visibleIds
    },
    clearTableColumnSettings(state, action: PayloadAction<string>) {
      delete state[action.payload]
    }
  }
})

export const { setTableColumnSettings, clearTableColumnSettings } =
  tableColumnSettingsSlice.actions

export default tableColumnSettingsSlice.reducer
