// src/components/custom/ColumnVisibilityManager.tsx - Premium Glass Edition

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
  ArrowRight, ArrowLeft, ArrowBigLeft, ArrowBigRight, RotateCw,
  Eye, EyeOff, Settings, Save, RefreshCw, X
} from 'lucide-react'
import { formatLabel } from '@/lib/helpers'
import { useTranslations } from '@/hooks/useTranslations';
import { dispatchShowToast } from '@/lib/dispatch'
import { getTableColumnSettings, updateTableColumnSettings } from '@/api/table'
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/redux/store";
import { setTableColumnSettings, clearTableColumnSettings } from "@/redux/slices/tableColumnSettingsSlice"
import { useAppSelector } from '@/hooks/useRedux'
import { cn } from '@/lib/utils'

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
  const { t } = useTranslations()
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark'

  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user);

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

      dispatchShowToast({
        type: 'success',
        message: t('Column settings refreshed from database'),
      })
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
  }, [])

  const loadSettings = async () => {
    if (reduxVisibleIds) {
      const columnMap: Record<string, ColumnDef<T, any>> = {}
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

  const visibleIds = visible.map(getColumnId)
  const hidden = initialColumns
    .filter(col => !visibleIds.includes(getColumnId(col)))
    .sort((a, b) => String(a.header).localeCompare(String(b.header)))

  const moveToHidden = (keys: ColumnKey[]) => {
    setVisible(prev => prev.filter(col => !keys.includes(getColumnId(col))))
    setSelectedVisible([])
    setSelectedHidden([])
  }

  const moveToVisible = (keys: ColumnKey[]) => {
    const toShow = initialColumns.filter(
      col => keys.includes(getColumnId(col)) && !visibleIds.includes(getColumnId(col))
    )
    setVisible(prev => [...prev, ...toShow])
    setSelectedVisible([])
    setSelectedHidden([])
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

  const reset = async () => {
    setVisible(initialColumns)
    setSelectedVisible([])
    setSelectedHidden([])
    setSearch('')

    dispatch(clearTableColumnSettings(REDUX_KEY))

    try {
      await updateTableColumnSettings(tableId, user?.id ?? '', initialColumns.map(getColumnId))

      dispatchShowToast({
        type: 'success',
        message: `Column settings reset to default`,
      })
    } catch (err) {
      console.warn('Reset error:', err)
      dispatchShowToast({
        type: 'danger',
        message: `Failed to reset column settings`,
      })
    }
  }

  const getColumnDisplayName = <T,>(col: ColumnDef<T>): string => {
    const header = col.header
    if (typeof header === 'string') return header
    if (header && typeof header === 'function') {
      if (col.id === 'select') return 'Select All'
      const headerStr = String(header)
      if (headerStr.includes('SelectAllCheckbox')) return 'Select All'
      return col.id || 'Column'
    }
    return col.id || 'Column'
  }

  const filteredHidden = hidden.filter(col =>
    (String(col.header) || '').toLowerCase().includes(search.toLowerCase())
  )

  const buttonBaseClass = "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
  const iconButtonClass = "flex items-center gap-2"

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen) loadSettings()
      else onClose()
    }}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-5xl overflow-hidden rounded-2xl p-0 shadow-2xl border-0">
        {/* Glass Container */}
        <div
          className="relative rounded-2xl backdrop-blur-xl"
          style={{
            background: isDarkMode
              ? 'rgba(17, 24, 39, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
          }}
        >
          {/* Animated gradient border overlay */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(100,120,255,0.08), rgba(180,100,255,0.05))',
            }}
          />

          {/* Colored accent line at top */}
          <div
            className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${isDarkMode ? '#6366f1' : '#818cf8'}, ${isDarkMode ? '#a855f7' : '#c084fc'}, transparent)`,
            }}
          />

          {/* Header */}
          <div className="relative z-10 px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  {t('Column Settings')}
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('Customize which columns to display and their order')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6">
            <div className="grid grid-cols-1 md:grid-cols-[40%_12%_40%] gap-6">
              {/* Visible Columns */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {t('Display')}
                  </h3>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {visible.length} columns
                  </span>
                </div>
                <ScrollArea className="h-[400px] rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                  <div className="space-y-1 p-2">
                    {visible.map(col => {
                      const colId = getColumnId(col)
                      const displayName = getColumnDisplayName(col)
                      const isSelected = selectedVisible.includes(colId)
                      return (
                        <div
                          key={colId}
                          onDoubleClick={() => moveToHidden([colId])}
                          onClick={e => handleSelect(colId, selectedVisible, setSelectedVisible, e)}
                          className={cn(
                            "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                            isSelected
                              ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 shadow-md"
                              : "hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md"
                          )}
                        >
                          <span className={cn(
                            "text-sm transition-colors",
                            isSelected ? "text-blue-700 dark:text-blue-300 font-medium" : "text-gray-700 dark:text-gray-300"
                          )}>
                            {t(displayName)}
                          </span>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          )}
                        </div>
                      )
                    })}
                    {visible.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        No columns selected
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Move buttons for visible columns */}
                <div className="flex flex-wrap gap-2 pt-2 justify-center">
                  <Button
                    title={t("Move Up")}
                    size="sm"
                    variant="outline"
                    onClick={() => move(selectedVisible, 'up')}
                    disabled={selectedVisible.length === 0}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    title={t("Move Down")}
                    size="sm"
                    variant="outline"
                    onClick={() => move(selectedVisible, 'down')}
                    disabled={selectedVisible.length === 0}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    title={t("Move to Top")}
                    size="sm"
                    variant="outline"
                    onClick={() => move(selectedVisible, 'top')}
                    disabled={selectedVisible.length === 0}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                  >
                    <ArrowBigUp className="w-4 h-4" />
                  </Button>
                  <Button
                    title={t("Move to Bottom")}
                    size="sm"
                    variant="outline"
                    onClick={() => move(selectedVisible, 'bottom')}
                    disabled={selectedVisible.length === 0}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                  >
                    <ArrowBigDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Center Controls */}
              <div className="flex flex-col justify-center items-center gap-3">
                <Button
                  title={t("Move to Do not Display")}
                  size="default"
                  onClick={() => moveToHidden(selectedVisible)}
                  disabled={selectedVisible.length === 0}
                  className={`${buttonBaseClass} ${iconButtonClass} bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/30 w-full`}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span className="hidden lg:inline">Hide</span>
                </Button>
                <Button
                  title={t("Move to Display")}
                  size="default"
                  onClick={() => moveToVisible(selectedHidden)}
                  disabled={selectedHidden.length === 0}
                  className={`${buttonBaseClass} ${iconButtonClass} bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/30 w-full`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden lg:inline">Show</span>
                </Button>
                <Button
                  title={t("Hide All")}
                  size="default"
                  variant="outline"
                  onClick={() => moveToHidden(visible.map(getColumnId))}
                  disabled={visible.length === 0}
                  className={`${buttonBaseClass} ${iconButtonClass} bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 w-full`}
                >
                  <ArrowBigRight className="w-4 h-4" />
                  <span className="hidden lg:inline">Hide All</span>
                </Button>
                <Button
                  title={t("Show All")}
                  size="default"
                  variant="outline"
                  onClick={() => moveToVisible(hidden.map(getColumnId))}
                  disabled={hidden.length === 0}
                  className={`${buttonBaseClass} ${iconButtonClass} bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 w-full`}
                >
                  <ArrowBigLeft className="w-4 h-4" />
                  <span className="hidden lg:inline">Show All</span>
                </Button>
              </div>

              {/* Hidden Columns */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                  <EyeOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {t('Do Not Display')}
                  </h3>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {hidden.length} columns
                  </span>
                </div>
                
                {/* Search input */}
                <div className="relative">
                  <Input
                    placeholder={t("Filter columns") + "..."}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <ScrollArea className="h-[350px] rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                  <div className="space-y-1 p-2">
                    {filteredHidden.map(col => {
                      const colId = getColumnId(col)
                      const displayName = getColumnDisplayName(col)
                      const isSelected = selectedHidden.includes(colId)
                      return (
                        <div
                          key={colId}
                          onDoubleClick={() => moveToVisible([colId])}
                          onClick={e => handleSelect(colId, selectedHidden, setSelectedHidden, e)}
                          className={cn(
                            "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                            isSelected
                              ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 shadow-md"
                              : "hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-md"
                          )}
                        >
                          <span className={cn(
                            "text-sm transition-colors",
                            isSelected ? "text-red-700 dark:text-red-300 font-medium" : "text-gray-700 dark:text-gray-300"
                          )}>
                            {t(displayName)}
                          </span>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                        </div>
                      )
                    })}
                    {filteredHidden.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        {search ? "No matching columns found" : "All columns are visible"}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-900/30 rounded-b-2xl">
            <DialogFooter className="flex justify-center sm:justify-end gap-3">
              <Button
                variant="default"
                size="default"
                onClick={onSave}
                disabled={visible.length === 0}
                className={`${buttonBaseClass} ${iconButtonClass} bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/30`}
              >
                <Save className="w-4 h-4" />
                {t('Save')}
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={refreshFromDB}
                className={`${buttonBaseClass} ${iconButtonClass} bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm`}
              >
                <RefreshCw className="w-4 h-4" />
                {t('Refresh')}
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={reset}
                className={`${buttonBaseClass} ${iconButtonClass} bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30`}
              >
                <RotateCw className="w-4 h-4" />
                {t('Reset')}
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={onClose}
                className={`${buttonBaseClass} ${iconButtonClass}`}
              >
                <X className="w-4 h-4" />
                {t('Close')}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}