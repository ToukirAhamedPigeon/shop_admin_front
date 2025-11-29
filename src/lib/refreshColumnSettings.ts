import type { ColumnDef } from '@tanstack/react-table'
import { dispatchSetTableColumnSettings, dispatchShowToast } from './dispatch'
import { getTableColumnSettings } from '@/api/table'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { useMemo } from 'react'

// Store generated IDs so they stay consistent
const columnIdCache = new WeakMap<object, string>()

function resolveColumnId<T>(col: ColumnDef<T>): string {
  if (col.id) return col.id

  const ak = (col as any).accessorKey
  if (typeof ak === 'string') return ak

  // Cache UUID so it stays stable
  if (!columnIdCache.has(col)) {
    columnIdCache.set(col, crypto.randomUUID())
  }
  return columnIdCache.get(col)!
}

/**
 * NON-HOOK UTILITY FUNCTION
 * (Safe to call anywhere — NO React hooks inside)
 */
export async function refreshColumnSettings<T>(
  tableId: string,
  userId: string,
  initialColumns: ColumnDef<T, any>[],
  onChange?: (visible: ColumnDef<T, any>[]) => void
): Promise<{ visibleColumns: ColumnDef<T, any>[], visibleIds: string[] }> {
  try {
    // Fetch saved settings from DB
    const savedIds: string[] = (await getTableColumnSettings(tableId, userId)) ?? []

    // Map columns by ID
    const columnMap: Record<string, ColumnDef<T>> = {}
    initialColumns.forEach(col => {
      columnMap[resolveColumnId(col)] = col
    })

    // Filter + reorder according to saved order
    const visibleColumns = savedIds
      .map(id => columnMap[id])
      .filter((col): col is ColumnDef<T> => Boolean(col))

    // Optional callback
    onChange?.(visibleColumns)

    return { visibleColumns, visibleIds: savedIds }
  } catch (err) {
    console.warn('Failed to refresh column settings from DB:', err)
    dispatchShowToast({
      type: 'danger',
      message: 'Failed to refresh column settings from database',
    })

    return { visibleColumns: [], visibleIds: [] }
  }
}

/**
 * HOOK VERSION — meant for React component usage only
 */
export function useRefreshColumnSettings<T>(
  tableId: string,
  initialColumns: ColumnDef<T, any>[],
  userId: string,
  onChange?: (visible: ColumnDef<T, any>[]) => void
) {
  const REDUX_KEY = `${userId}:${tableId}`

  const reduxVisibleIds = useSelector(
    (state: RootState) => state.tableColumnSettings[REDUX_KEY] ?? null
  )

  // Build column map once per render
  const resolvedColumns = useMemo(() => {
    if (!reduxVisibleIds) return null

    const columnMap: Record<string, ColumnDef<T>> = {}
    initialColumns.forEach(col => (columnMap[resolveColumnId(col)] = col))

    return reduxVisibleIds
      .map(id => columnMap[id])
      .filter((col): col is ColumnDef<T> => Boolean(col))
  }, [reduxVisibleIds, initialColumns])

  // Refresh function for components
  const refresh = async () => {
    const { visibleColumns, visibleIds } = await refreshColumnSettings(
      tableId,
      userId,
      initialColumns,
      onChange
    )

    // Sync Redux only inside React
    dispatchSetTableColumnSettings({ key: REDUX_KEY, visibleIds })

    return visibleColumns
  }

  return {
    columns: resolvedColumns ?? initialColumns,
    refresh,
  }
}
