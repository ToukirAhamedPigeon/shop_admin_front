import React, {
  useEffect,
  useState,
  type MouseEvent
} from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowUp, ArrowDown, ArrowBigUp, ArrowBigDown,
  ArrowRight, ArrowLeft, ArrowBigLeft, ArrowBigRight, RotateCw
} from 'lucide-react'
import { formatLabel } from '@/lib/helpers'
import { useTranslations } from '@/hooks/useTranslations';
import { dispatchShowToast } from '@/lib/dispatch'
import { getTableColumnSettings, updateTableColumnSettings } from '@/api/table'
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/redux/store";
import { setTableColumnSettings, clearTableColumnSettings } from "@/redux/slices/tableColumnSettingsSlice"

export type ColumnKey = string

interface ColumnVisibilityManagerProps<T> {
  tableId: string
  initialColumns: ColumnDef<T, any>[]
  open: boolean
  onClose: () => void
  onChange?: (visibleColumns: ColumnDef<T, any>[]) => void
}

export function ColumnVisibilityManager<T>({
  tableId,
  initialColumns,
  open,
  onClose,
  onChange
}: ColumnVisibilityManagerProps<T>) {
  const [visible, setVisible] = useState<ColumnDef<T>[]>([])
  const [selectedVisible, setSelectedVisible] = useState<string[]>([])
  const [selectedHidden, setSelectedHidden] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const {t} = useTranslations()

  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user);

  // const LOCAL_KEY = `columnConfig:${tableId}`
  const REDUX_KEY = `${user?.id}:${tableId}`
  const reduxVisibleIds = useSelector(
  (state: any) => state.tableColumnSettings[REDUX_KEY] ?? null
)

  const getColumnId = (col: ColumnDef<T>): string =>
    col.id ?? (typeof (col as any).accessorKey === 'string'
      ? (col as any).accessorKey
      : undefined) ?? crypto.randomUUID()

  const refreshFromDB = async () => {
    try {
      const showColumnCombinations = await getTableColumnSettings(tableId, user?.id ?? '')
      const visibleIds: string[] = showColumnCombinations ?? []

      const columnMap: Record<string, ColumnDef<T>> = {}
      initialColumns.forEach(col => (columnMap[getColumnId(col)] = col))

      const matched = visibleIds
        .map(id => columnMap[id])
        .filter((col): col is ColumnDef<T> => !!col)

      setVisible(matched)

      dispatch(setTableColumnSettings({ key: REDUX_KEY, visibleIds }))

      setSelectedVisible([])
      setSelectedHidden([])
      setSearch('')

      // dispatchShowToast({
      //   type: 'success',
      //   message: t('Column settings refreshed from database'),
      // })
    } catch (err) {
      console.warn('Failed to refresh column settings from DB:', err)
      dispatchShowToast({
        type: 'danger',
        message: t('Failed to refresh column settings from database'),
      })
    }
  }


  useEffect(() => {
    loadSettings()
  },[])
  const loadSettings = async () => {
    if (reduxVisibleIds) {
      // Load from Redux (not localStorage)
      const columnMap: Record<string, ColumnDef<T, any>> = {}

      // Explicitly type col
      initialColumns.forEach((col: ColumnDef<T, any>) => {
        columnMap[getColumnId(col)] = col
      })

      const matched = reduxVisibleIds
        .map((id: string) => columnMap[id])
        .filter((col: ColumnDef<T, any> | undefined): col is ColumnDef<T, any> => !!col)

      setVisible(matched)
    } else {
      await refreshFromDB()
    }

    setSelectedVisible([])
    setSelectedHidden([])
    setSearch('')
  }


  // const allIds = initialColumns.map(getColumnId)
  const visibleIds = visible.map(getColumnId)
  const hidden = initialColumns
    .filter(col => !visibleIds.includes(getColumnId(col)))
    .sort((a, b) => String(a.header).localeCompare(String(b.header)))

  const moveToHidden = (keys: ColumnKey[]) => {
    setVisible(prev => prev.filter(col => !keys.includes(getColumnId(col))))
  }

  const moveToVisible = (keys: ColumnKey[]) => {
    const toShow = initialColumns.filter(
      col => keys.includes(getColumnId(col)) && !visibleIds.includes(getColumnId(col))
    )
    setVisible(prev => [...prev, ...toShow])
  }

  const move = (keys: ColumnKey[], direction: 'up' | 'down' | 'top' | 'bottom') => {
    let current = [...visible]
    const getId = (col: ColumnDef<T>) => getColumnId(col)

    if (direction === 'top' || direction === 'bottom') {
      const toMove = current.filter(col => keys.includes(getId(col)))
      const rest = current.filter(col => !keys.includes(getId(col)))
      setVisible(direction === 'top' ? [...toMove, ...rest] : [...rest, ...toMove])
      return
    }

    const getIndex = (id: string) => current.findIndex(col => getId(col) === id)
    const keyList = direction === 'down' ? [...keys].reverse() : keys

    for (const id of keyList) {
      const i = getIndex(id)
      const j = direction === 'up' ? i - 1 : i + 1
      if (i >= 0 && j >= 0 && j < current.length) {
        [current[i], current[j]] = [current[j], current[i]]
      }
    }
    setVisible(current)
  }

  const handleSelect = (
    id: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    e: MouseEvent
  ) => {
    if (e.metaKey || e.ctrlKey) {
      setSelected(selected.includes(id)
        ? selected.filter(i => i !== id)
        : [...selected, id])
    } else {
      setSelected([id])
    }
  }

  const onSave = async () => {
    const visibleColumnIds = visible.map(getColumnId)

    dispatch(setTableColumnSettings({ key: REDUX_KEY, visibleIds: visibleColumnIds }))
    onChange?.(visible)
    onClose()

    try {
      const res = await updateTableColumnSettings(tableId, user?.id ?? '', visibleColumnIds)

      const formattedTable = formatLabel(tableId, 'sentence')
      if (res.status === 200 && res.data?.success) {
        dispatchShowToast({
          type: 'success',
          message: `Saved column settings for ${formattedTable}`,
        })
      } else {
        dispatchShowToast({
          type: 'danger',
          message: `Failed to save settings for ${formattedTable}`,
        })
      }
    } catch (err) {
      console.warn('Save error:', err)
      dispatchShowToast({
        type: 'danger',
        message: `Error saving settings for ${formatLabel(tableId, 'sentence')}`,
      })
    }
  }


  const reset = () => {
    setVisible(initialColumns)
    setSelectedVisible([])
    setSelectedHidden([])
    setSearch('')

    dispatch(clearTableColumnSettings(REDUX_KEY))
  }

  const filteredHidden = hidden.filter(col =>
    (String(col.header) || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) loadSettings()
        else onClose()
      }}
    >
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-4xl min-h-[95vh] overflow-auto [&>[data-radix-dialog-close]]:hidden">
        <DialogHeader>
          <DialogTitle>{t('Column Settings')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[42%_8%_42%] gap-4">
          {/* Visible Columns */}
          <div>
            <h3 className="font-bold mb-2">{t('Display')}</h3>
            <ScrollArea className="border border-gray-600 dark:border-gray-700 rounded h-120 space-y-1">
              {visible.map(col => {
                const colId = getColumnId(col)
                return (
                  <div key={colId} className="border-b border-gray-300 dark:border-gray-700">
                    <div
                      onDoubleClick={() => moveToHidden([colId])}
                      onClick={e => handleSelect(colId, selectedVisible, setSelectedVisible, e)}
                      className={`w-full py-1 px-2 cursor-pointer ${selectedVisible.includes(colId) ? 'bg-blue-200' : ''}`}
                    >
                      {t(String(col.header))}
                    </div>
                  </div>
                )
              })}
            </ScrollArea>
            <div className="flex flex-wrap gap-1 mt-2 items-center justify-center">
              <Button title={t("Move Up")} size="xs" onClick={() => move(selectedVisible, 'up')}><ArrowUp /></Button>
              <Button title={t("Move Down")} size="xs" onClick={() => move(selectedVisible, 'down')}><ArrowDown /></Button>
              <Button title={t("Move to Top")} size="xs" onClick={() => move(selectedVisible, 'top')}><ArrowBigUp /></Button>
              <Button title={t("Move to Bottom")} size="xs" onClick={() => move(selectedVisible, 'bottom')}><ArrowBigDown /></Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-center items-center gap-2">
            <Button title={t("Move to Do not Display")} size="xs" onClick={() => moveToHidden(selectedVisible)}><ArrowRight /></Button>
            <Button title={t("Move to Display")} size="xs" onClick={() => moveToVisible(selectedHidden)}><ArrowLeft /></Button>
            <Button title={t("Hide All")} size="xs" onClick={() => moveToHidden(visible.map(getColumnId))}><ArrowBigRight /></Button>
            <Button title={t("Show All")} size="xs" onClick={() => moveToVisible(hidden.map(getColumnId))}><ArrowBigLeft /></Button>
          </div>

          {/* Hidden Columns */}
          <div>
            <h3 className="font-bold mb-2">{t('Do Not Display')}</h3>
            <ScrollArea className="border border-gray-600 dark:border-gray-700 rounded h-120 space-y-1">
              {filteredHidden.map(col => {
                const colId = getColumnId(col)
                return (
                  <div key={colId} className="border-b border-gray-300 dark:border-gray-700">
                    <div
                      onDoubleClick={() => moveToVisible([colId])}
                      onClick={e => handleSelect(colId, selectedHidden, setSelectedHidden, e)}
                      className={`w-full py-1 px-2 cursor-pointer ${selectedHidden.includes(colId) ? 'bg-blue-200 dark:bg-blue-600' : ''}`}
                    >
                      {t(String(col.header))}
                    </div>
                  </div>
                )
              })}
            </ScrollArea>
            <Input
              placeholder={t("Filter columns")+'...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-center items-center sm:justify-end mt-4 flex-wrap gap-2">
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={onSave} disabled={visible.length === 0}>{t('Save')}</Button>
            <Button variant="outline" size="sm" onClick={refreshFromDB}><RotateCw className="mr-2 h-4 w-4" />{t('Refresh')}</Button>
            <Button variant="outline" size="sm" onClick={reset}>{t('Reset')}</Button>
            <Button variant="destructive" size="sm" onClick={onClose}>{t('Close')}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
