// src/components/custom/Table.tsx - Premium Glass Edition with Focus Gradient Border

import { useEffect, useMemo, type ReactNode } from "react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaEye, FaEdit, FaTrash, FaPlus, FaPrint, FaFileExcel, FaSlidersH, FaFilter, FaTrashRestore, FaEllipsisH } from 'react-icons/fa'
import { useTranslations } from "@/hooks/useTranslations";
import Loader from "@/components/custom/Loader";
import { formatNumber } from "@/lib/helpers";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { Can } from "./Can";
import type { Row} from '@tanstack/react-table'
import type { Table as TanStackTable } from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppSelector } from "@/hooks/useRedux";

export const SelectAllCheckbox = <TData,>({ table }: { table: TanStackTable<TData> }) => {
  const { rows } = table.getRowModel()
  
  const selectableRows = rows.filter((row: Row<TData>) => {
    const user = row.original as any
    const hasDeveloperRole = user.roles?.includes('developer') || 
                              user.roleNames?.split(',').map((r: string) => r.trim()).includes('developer')
    const isValidGuid = (id: string): boolean => {
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return guidRegex.test(id);
    }
    return !hasDeveloperRole && user.id && isValidGuid(user.id)
  })
  
  const isAllSelectableSelected = selectableRows.length > 0 && 
    selectableRows.every((row: Row<TData>) => row.getIsSelected())
  const isSomeSelectableSelected = selectableRows.some((row: Row<TData>) => row.getIsSelected()) && !isAllSelectableSelected
  
  const handleSelectAll = () => {
    if (isAllSelectableSelected) {
      table.setRowSelection({})
    } else {
      const newSelection: Record<string, boolean> = {}
      selectableRows.forEach((row: Row<TData>) => {
        newSelection[row.id] = true
      })
      table.setRowSelection(newSelection)
    }
  }
  
  let checkedState: boolean = false
  let indeterminateState: boolean = false
  
  if (selectableRows.length > 0) {
    if (isAllSelectableSelected) {
      checkedState = true
      indeterminateState = false
    } else if (isSomeSelectableSelected) {
      checkedState = false
      indeterminateState = true
    } else {
      checkedState = false
      indeterminateState = false
    }
  }
  
  return (
    <div 
      className="flex justify-center cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation()
        handleSelectAll()
      }}
    >
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
        checkedState
          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 dark:from-blue-400 dark:to-indigo-500 dark:border-blue-400'
          : indeterminateState
            ? 'bg-blue-200 border-blue-400 dark:bg-blue-800 dark:border-blue-600'
            : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
      }`}>
        {checkedState && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {indeterminateState && (
          <div className="w-2 h-0.5 bg-blue-600 dark:bg-blue-400" />
        )}
      </div>
    </div>
  )
}

/** --- RowActions Component --- **/
interface RowActionsProps<T> {
  row: T
  onDetail?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onRestore?: (row: T) => void
  onPermanentDelete?: (row: T) => void
  showDetail?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showRestore?: boolean
  showPermanentDelete?: boolean
  detailPermissions?: string[]
  editPermissions?: string[]
  deletePermissions?: string[]
  restorePermissions?: string[]
  permanentDeletePermissions?: string[]
}

export function RowActions<T>({
  row,
  onDetail,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  showDetail = true,
  showEdit = true,
  showDelete = true,
  showRestore = true,
  showPermanentDelete = false,
  detailPermissions = [],
  editPermissions = [],
  deletePermissions = [],
  restorePermissions = [],
  permanentDeletePermissions = [],
}: RowActionsProps<T>) {
  const { t } = useTranslations();
  return (
    <div className="flex gap-2 dark:text-gray-200 justify-center flex-wrap">
      {showDetail && onDetail && (
        <Can anyOf={detailPermissions}>
          <Button 
            size="sm" 
            variant="info" 
            onClick={() => onDetail(row)}
            className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <FaEye />
            <span className="hidden md:block ml-1">{t("Detail")}</span>
          </Button>
        </Can>
      )}

      {showEdit && onEdit && (
        <Can anyOf={editPermissions}>
          <Button 
            size="sm" 
            variant="warning" 
            onClick={() => onEdit(row)}
            className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <FaEdit />
            <span className="hidden md:block ml-1">{t("Edit")}</span>
          </Button>
        </Can>
      )}

      {showDelete && onDelete && (
        <Can anyOf={deletePermissions}>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onDelete(row)}
            className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <FaTrash />
            <span className="hidden md:block ml-1">{t("Delete")}</span>
          </Button>
        </Can>
      )}

      {showRestore && onRestore && (
        <Can anyOf={restorePermissions}>
          <Button 
            size="sm" 
            variant="success" 
            onClick={() => onRestore(row)}
            className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <FaTrashRestore className="h-4 w-4" />
            <span className="hidden md:block ml-1">{t("Restore")}</span>
          </Button>
        </Can>
      )}

      {showPermanentDelete && onPermanentDelete && (
        <Can anyOf={permanentDeletePermissions}>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onPermanentDelete(row)}
            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <FaTrash />
            <span className="hidden md:block ml-1">{t("Permanent Delete")}</span>
          </Button>
        </Can>
      )}
    </div>
  );
}

/** --- RecordInfo Component --- **/
interface RecordInfoProps {
  pageIndex: number
  pageSize: number
  totalCount: number
  grandTotalCount?: number
}

export function RecordInfo({ pageIndex, pageSize, totalCount, grandTotalCount }: RecordInfoProps) {
  const { t } = useTranslations();
  return (
    <span className="text-sm text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
      {typeof pageIndex === 'number' &&
      typeof pageSize === 'number' &&
      typeof totalCount === 'number' && (
        <>
          {t('common.Showing','Showing')}{' '}
          <strong className="text-gray-900 dark:text-white font-semibold">{totalCount > 0 ? (pageIndex * pageSize + 1) : 0}</strong>{' '}
          {t('common.to','To')}{' '}
          <strong className="text-gray-900 dark:text-white font-semibold">{Math.min((pageIndex + 1) * pageSize, totalCount)}</strong>{' '}
          {t('common.of','Of')}{' '}
          <strong className="text-gray-900 dark:text-white font-semibold">{totalCount}</strong>{' '}
          {t('filtered results','filtered results')}{' '}
          {typeof grandTotalCount === 'number' && (
            <>
              {' '}
              ({t('common.total','Total')} <strong className="text-gray-900 dark:text-white">{grandTotalCount}</strong>)
            </>
          )}
        </>
      )}
    </span>
  )
}

/** --- IndexCell Component --- **/
interface IndexCellProps {
  rowIndex: number
  pageIndex: number
  pageSize: number
}

export function IndexCell({ rowIndex, pageIndex, pageSize }: IndexCellProps) {
  return (
    <span className="text-gray-700 dark:text-gray-300 font-medium">
      {rowIndex + 1 + pageIndex * pageSize}
    </span>
  )
}

// TableHeaderActions component with premium styling
interface TableHeaderActionsProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onAddNew?: () => void
  onPrint?: () => void
  onExport?: () => void
  onColumnSettings?: () => void
  onFilter?: () => void
  onBulkDelete?: () => void
  onBulkRestore?: () => void
  onBulkPermanentDelete?: () => void
  onResetSorting?: () => void
  isFilterActive?: boolean
  addButtonLabel?: string
  showSearch?: boolean
  showAddButton?: boolean
  showTrashButton?: boolean
  showFilterButton?: boolean
  showPrintButton?: boolean
  showExportButton?: boolean
  showColumnSettingsButton?: boolean
  showBulkActions?: boolean
  showResetSorting?: boolean
  selectedCount?: number
  trashButton?: {
    onClick: () => void
    label?: string
    show?: boolean
  }
  storeButton?: {  
    onClick: () => void
    label?: string
    show?: boolean
  }
}

export function TableHeaderActions({
  searchValue,
  onSearchChange,
  onAddNew,
  onPrint,
  onExport,
  onColumnSettings,
  onFilter,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onResetSorting,
  isFilterActive = false,
  addButtonLabel = 'common.Add New',
  showSearch = true,
  showAddButton = true,
  showTrashButton = true,
  showFilterButton = true,
  showPrintButton = true,
  showExportButton = true,
  showColumnSettingsButton = true,
  showBulkActions = false,
  showResetSorting = false,
  selectedCount = 0,
  trashButton,
  storeButton,
}: TableHeaderActionsProps) {
  const { t } = useTranslations();
  const hasSelection = selectedCount > 0;
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  const buttonBaseClass = "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105";
  const iconButtonClass = "flex items-center gap-2";

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-between gap-3 mb-6">
      {showSearch &&
        <div className="relative w-full sm:w-[280px] md:w-1/3 group">
          <Input
            aria-label="Search"
            placeholder={t("Search") + "..."}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-0 group-focus-within:border-transparent"
          />
          {/* Gradient border on focus */}
          <div className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 opacity-0 group-focus-within:opacity-100"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)'
                : 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
              padding: '2px',
              borderRadius: '0.75rem',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-300 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      }
      
      <div className="flex gap-2 relative flex-wrap">
        {showAddButton && onAddNew && (
          <Button
            onClick={onAddNew}
            aria-label="Add new item"
            className={`${buttonBaseClass} ${iconButtonClass} bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/30`}
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span className="hidden lg:block">{t(addButtonLabel, 'Add New')}</span>
          </Button>
        )}

        {showFilterButton && onFilter && (
          <Button
            onClick={onFilter}
            aria-label="Open filter modal"
            className={`${buttonBaseClass} ${iconButtonClass} relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white`}
          >
            <FaFilter className="w-3.5 h-3.5" />
            <span className="hidden lg:block">{t('Filter')}</span>
            {isFilterActive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg" />
            )}
          </Button>
        )}

        {/* Reset Sorting Button */}
        {showResetSorting && onResetSorting && (
          <Button
            onClick={onResetSorting}
            aria-label="Reset sorting"
            variant="outline"
            className={`${buttonBaseClass} ${iconButtonClass} border-2 border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 backdrop-blur-sm`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{t('Reset Sorting')}</span>
          </Button>
        )}

        {/* Bulk Actions */}
        {showBulkActions && (
          <>
            {storeButton?.show && onBulkRestore && (
              <Button
                onClick={onBulkRestore}
                disabled={!hasSelection}
                aria-label="Bulk restore selected items"
                className={`${buttonBaseClass} ${iconButtonClass} ${
                  hasSelection 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/30' 
                    : 'opacity-50 cursor-not-allowed bg-gray-400 dark:bg-gray-600'
                }`}
              >
                <FaTrashRestore className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Restore')} {hasSelection && `(${selectedCount})`}</span>
              </Button>
            )}
            
            {!storeButton?.show && trashButton?.show && onBulkDelete && (
              <Button
                onClick={onBulkDelete}
                disabled={!hasSelection}
                aria-label="Bulk move to trash"
                className={`${buttonBaseClass} ${iconButtonClass} ${
                  hasSelection 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-orange-500/30' 
                    : 'opacity-50 cursor-not-allowed bg-gray-400 dark:bg-gray-600'
                }`}
              >
                <FaTrash className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Delete')} {hasSelection && `(${selectedCount})`}</span>
              </Button>
            )}
            
            {storeButton?.show && onBulkPermanentDelete && (
              <Button
                onClick={onBulkPermanentDelete}
                disabled={!hasSelection}
                className={`${buttonBaseClass} ${iconButtonClass} ${
                  hasSelection 
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-red-600/30' 
                    : 'opacity-50 cursor-not-allowed bg-gray-400 dark:bg-gray-600'
                }`}
              >
                <FaTrash className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Permanent Delete')} {hasSelection && `(${selectedCount})`}</span>
              </Button>
            )}
          </>
        )}

        {/* Trash Button */}
        {showTrashButton && trashButton?.show && trashButton.onClick && (
          <Button
            onClick={trashButton.onClick}
            aria-label="View deleted items"
            className={`${buttonBaseClass} ${iconButtonClass} bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-orange-500/30`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">{trashButton.label || t('Trash')}</span>
          </Button>
        )}

        {/* Store Button */}
        {storeButton?.show && storeButton.onClick && (
          <Button
            onClick={storeButton.onClick}
            aria-label="View active items"
            className={`${buttonBaseClass} ${iconButtonClass} bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/30`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline">{storeButton.label || t('Store')}</span>
          </Button>
        )}
        
        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`${buttonBaseClass} ${iconButtonClass} bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50`}
              aria-label="More actions"
            >
              <FaEllipsisH className="w-3 h-3" />
              <span className="hidden lg:block">{t('More')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl">
            {showPrintButton && onPrint && (
              <DropdownMenuItem 
                onClick={onPrint} 
                className="cursor-pointer hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-sky-950/50 dark:hover:to-blue-950/50 transition-all duration-200 rounded-lg m-1"
              >
                <FaPrint className="w-4 h-4 mr-3 text-sky-600 dark:text-sky-400" />
                <span>{t('Print')}</span>
              </DropdownMenuItem>
            )}
            {showExportButton && onExport && (
              <DropdownMenuItem 
                onClick={onExport} 
                className="cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/50 dark:hover:to-emerald-950/50 transition-all duration-200 rounded-lg m-1"
              >
                <FaFileExcel className="w-4 h-4 mr-3 text-green-600 dark:text-green-400" />
                <span>{t('Excel')}</span>
              </DropdownMenuItem>
            )}
            {showColumnSettingsButton && onColumnSettings && (
              <DropdownMenuItem 
                onClick={onColumnSettings} 
                className="cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/50 dark:hover:to-pink-950/50 transition-all duration-200 rounded-lg m-1"
              >
                <FaSlidersH className="w-4 h-4 mr-3 text-purple-600 dark:text-purple-400" />
                <span>{t('Columns')}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

interface TablePaginationFooterProps {
  pageIndex: number
  pageSize: number
  totalCount: number
  grandTotalCount?: number
  setPageIndex: (value: number) => void
  setPageSize: (value: number) => void
  showRecordInfo?: boolean
  showPagination?: boolean
  showRowsPerPage?: boolean
}

export function TablePaginationFooter({
  pageIndex,
  pageSize,
  totalCount,
  grandTotalCount,
  setPageIndex,
  setPageSize,
  showRecordInfo = true,
  showPagination = true,
  showRowsPerPage = true,
}: TablePaginationFooterProps) {
  const { currentLang } = useSelector((state: RootState) => state.language);
  const { t } = useTranslations()
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
  const totalPage = Math.ceil(totalCount / pageSize)

  const maxVisiblePages =
    typeof window !== "undefined"
      ? window.innerWidth < 640
        ? 3
        : window.innerWidth < 1024
        ? 5
        : 7
      : 5

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = []

    if (totalPage <= maxVisiblePages) {
      return Array.from({ length: totalPage }, (_, i) => i)
    }

    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(pageIndex - half, 0)
    let end = Math.min(start + maxVisiblePages - 1, totalPage - 1)

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(end - maxVisiblePages + 1, 0)
    }

    if (start > 0) {
      pages.push(0)
      if (start > 1) pages.push("...")
    }

    for (let i = start; i <= end; i++) pages.push(i)

    if (end < totalPage - 1) {
      if (end < totalPage - 2) pages.push("...")
      pages.push(totalPage - 1)
    }

    return pages
  }, [pageIndex, totalPage, maxVisiblePages])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!showPagination) return
      if (e.key === "ArrowLeft" && pageIndex > 0) {
        setPageIndex(pageIndex - 1)
      }
      if (e.key === "ArrowRight" && pageIndex < totalPage - 1) {
        setPageIndex(pageIndex + 1)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [pageIndex, totalPage, setPageIndex, showPagination])

  if (totalCount === 0) return null

  const buttonBaseClass = "shadow-md hover:shadow-lg transition-all duration-300"
  const paginationButtonClass = `${buttonBaseClass} backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700`

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm gap-3 transition-all duration-300">
      {showRecordInfo && <RecordInfo {...{ pageIndex, pageSize, totalCount, grandTotalCount }} />}

      <div className="flex items-center gap-2 flex-wrap">
        {showRowsPerPage && (
          <div className="flex items-center gap-2">
            <label className="hidden md:block text-gray-600 dark:text-gray-400 text-sm">
              {t("common.Rows_per_page","Rows per page")}:
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm cursor-pointer hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 dark:text-gray-200"
            >
              {[10, 25, 50, 100, 500, 1000].map(size => (
                <option key={size} value={size}>
                  {formatNumber(size, currentLang)}
                </option>
              ))}
            </select>
          </div>
        )}

        {showPagination && totalPage > 1 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setPageIndex(pageIndex - 1)}
              disabled={pageIndex === 0}
              className={`${paginationButtonClass} ${pageIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} text-gray-700 dark:text-gray-200`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("common.Previous","Previous")}
            </Button>

            <div className="flex items-center gap-1.5">
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={i} className="px-2 text-gray-400 dark:text-gray-500">…</span>
                ) : (
                  <Button
                    key={p}
                    size="sm"
                    onClick={() => setPageIndex(p)}
                    className={`min-w-[40px] transition-all duration-300 ${
                      p === pageIndex
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-110"
                        : `${paginationButtonClass} hover:scale-105 text-gray-700 dark:text-gray-200`
                    }`}
                  >
                    {formatNumber(p + 1, currentLang)}
                  </Button>
                )
              )}
            </div>

            <Button
              size="sm"
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={pageIndex >= totalPage - 1}
              className={`${paginationButtonClass} ${pageIndex >= totalPage - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} text-gray-700 dark:text-gray-200`}
            >
              {t("common.Next","Next")}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>

            <div className="relative">
              <input
                type="number"
                min={1}
                max={totalPage}
                placeholder={t("common.Page","Page")}
                className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-center text-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 dark:text-gray-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = Number((e.target as HTMLInputElement).value)
                    if (value >= 1 && value <= totalPage) {
                      setPageIndex(value - 1)
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** --- TableLoader Component --- **/
export function TableLoader({ loading }: { loading: boolean }) {
  return loading ? (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
        <Loader type="bars" size={48} />
      </div>
    </div>
  ) : null;
}

export const EmptyState = ({ message, suggestion }: { message?: string; suggestion?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
    <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
      <svg
        className="w-12 h-12 text-gray-400 dark:text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
      {message || "No data found"}
    </p>
    {suggestion && (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {suggestion}
      </p>
    )}
  </div>
)

interface TrashViewIndicatorProps {
  type: 'trash' | 'store'
  className?: string
}

export function TrashViewIndicator({ 
  type,
  className = ''
}: TrashViewIndicatorProps) {
  const isTrash = type === 'trash'
  
  const config = {
    trash: {
      bg: 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50',
      text: 'text-orange-800 dark:text-orange-200',
      border: 'border-orange-300 dark:border-orange-700',
      label: 'Trash View',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    },
    store: {
      bg: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-300 dark:border-blue-700',
      label: 'Store View',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    }
  }

  const style = isTrash ? config.trash : config.store

  return (
    <div className={`px-3 py-1.5 ${style.bg} border ${style.border} rounded-xl ${style.text} inline-flex items-center gap-2 text-sm font-medium backdrop-blur-sm ${className}`}>
      {style.icon}
      <span>{style.label}</span>
    </div>
  )
}

interface TableWithLoaderProps {
  loading: boolean
  children: ReactNode
  className?: string
  id?: string
  containerClassName?: string
  transparent?: boolean
}

export function TableWithLoader({ 
  loading, 
  children, 
  className = '',
  id,
  containerClassName = 'max-h-[600px] min-h-[200px] overflow-y-auto relative rounded-xl',
  transparent = false
}: TableWithLoaderProps) {
  return (
    <div 
      className={`relative rounded-xl overflow-hidden ${!transparent ? 'bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm' : 'bg-transparent'} ${className}`}
      id={id}
    >
      <div className={containerClassName}>
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md">
            <TableLoader loading={true} />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}