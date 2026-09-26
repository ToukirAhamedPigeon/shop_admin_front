// src/components/custom/Table.tsx - shared advanced datatable chrome

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
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
        checkedState
          ? 'bg-primary border-primary'
          : indeterminateState
            ? 'bg-primary/20 border-primary/50'
            : 'border-border bg-background hover:border-primary/50'
      }`}>
        {checkedState && (
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {indeterminateState && (
          <div className="w-2 h-0.5 bg-primary" />
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
  const base =
    "size-8 rounded-md text-muted-foreground transition-colors [&_svg]:size-3.5"
  return (
    <div className="flex items-center justify-center gap-0.5">
      {showDetail && onDetail && (
        <Can anyOf={detailPermissions}>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDetail(row)}
            title={t("Detail")}
            aria-label={t("Detail")}
            className={`${base} hover:text-foreground`}
          >
            <FaEye />
          </Button>
        </Can>
      )}

      {showEdit && onEdit && (
        <Can anyOf={editPermissions}>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(row)}
            title={t("Edit")}
            aria-label={t("Edit")}
            className={`${base} hover:text-primary`}
          >
            <FaEdit />
          </Button>
        </Can>
      )}

      {showDelete && onDelete && (
        <Can anyOf={deletePermissions}>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(row)}
            title={t("Delete")}
            aria-label={t("Delete")}
            className={`${base} hover:bg-destructive/10 hover:text-destructive`}
          >
            <FaTrash />
          </Button>
        </Can>
      )}

      {showRestore && onRestore && (
        <Can anyOf={restorePermissions}>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRestore(row)}
            title={t("Restore")}
            aria-label={t("Restore")}
            className={`${base} hover:bg-success/10 hover:text-success`}
          >
            <FaTrashRestore />
          </Button>
        </Can>
      )}

      {showPermanentDelete && onPermanentDelete && (
        <Can anyOf={permanentDeletePermissions}>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onPermanentDelete(row)}
            title={t("Permanent Delete")}
            aria-label={t("Permanent Delete")}
            className={`${base} text-destructive/80 hover:bg-destructive/10 hover:text-destructive`}
          >
            <FaTrash />
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
    <span className="text-sm text-muted-foreground">
      {typeof pageIndex === 'number' &&
      typeof pageSize === 'number' &&
      typeof totalCount === 'number' && (
        <>
          {t('common.Showing','Showing')}{' '}
          <strong className="text-foreground font-medium">{totalCount > 0 ? (pageIndex * pageSize + 1) : 0}</strong>{' '}
          {t('common.to','To')}{' '}
          <strong className="text-foreground font-medium">{Math.min((pageIndex + 1) * pageSize, totalCount)}</strong>{' '}
          {t('common.of','Of')}{' '}
          <strong className="text-foreground font-medium">{totalCount}</strong>{' '}
          {t('filtered results','filtered results')}{' '}
          {typeof grandTotalCount === 'number' && (
            <>
              {' '}
              ({t('common.total','Total')} <strong className="text-foreground font-medium">{grandTotalCount}</strong>)
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
    <span className="text-muted-foreground">
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

  const iconButtonClass = "flex items-center gap-2";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
      {showSearch &&
        <div className="relative w-full sm:max-w-xs group">
          <Input
            aria-label="Search"
            placeholder={t("Search") + "..."}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      }
      
      <div className="flex gap-2 relative flex-wrap justify-end">
        {showAddButton && onAddNew && (
          <Button
            onClick={onAddNew}
            aria-label="Add new item"
            className={iconButtonClass}
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span className="hidden lg:block">{t(addButtonLabel, 'Add New')}</span>
          </Button>
        )}

        {showFilterButton && onFilter && (
          <Button
            onClick={onFilter}
            aria-label="Open filter modal"
            variant="outline"
            className={`${iconButtonClass} relative`}
          >
            <FaFilter className="w-3.5 h-3.5" />
            <span className="hidden lg:block">{t('Filter')}</span>
            {isFilterActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </Button>
        )}

        {/* Reset Sorting Button */}
        {showResetSorting && onResetSorting && (
          <Button
            onClick={onResetSorting}
            aria-label="Reset sorting"
            variant="outline"
            className={iconButtonClass}
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
                variant="success"
                className={iconButtonClass}
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
                variant="destructive"
                className={iconButtonClass}
              >
                <FaTrash className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Delete')} {hasSelection && `(${selectedCount})`}</span>
              </Button>
            )}

            {storeButton?.show && onBulkPermanentDelete && (
              <Button
                onClick={onBulkPermanentDelete}
                disabled={!hasSelection}
                variant="destructive"
                className={iconButtonClass}
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
            variant="outline"
            className={iconButtonClass}
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
            variant="outline"
            className={iconButtonClass}
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
              className={iconButtonClass}
              aria-label="More actions"
            >
              <FaEllipsisH className="w-3 h-3" />
              <span className="hidden lg:block">{t('More')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px] p-1 bg-popover border border-border shadow-lg rounded-lg">
            {showPrintButton && onPrint && (
              <DropdownMenuItem
                onClick={onPrint}
                className="cursor-pointer rounded-md"
              >
                <FaPrint className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <span>{t('Print')}</span>
              </DropdownMenuItem>
            )}
            {showExportButton && onExport && (
              <DropdownMenuItem
                onClick={onExport}
                className="cursor-pointer rounded-md"
              >
                <FaFileExcel className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <span>{t('Excel')}</span>
              </DropdownMenuItem>
            )}
            {showColumnSettingsButton && onColumnSettings && (
              <DropdownMenuItem
                onClick={onColumnSettings}
                className="cursor-pointer rounded-md"
              >
                <FaSlidersH className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
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

  const paginationButtonClass = "bg-card hover:bg-accent border border-input shadow-xs"

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm gap-3">
      {showRecordInfo && <RecordInfo {...{ pageIndex, pageSize, totalCount, grandTotalCount }} />}

      <div className="flex items-center gap-2 flex-wrap">
        {showRowsPerPage && (
          <div className="flex items-center gap-2">
            <label className="hidden md:block text-muted-foreground text-sm">
              {t("common.Rows_per_page","Rows per page")}:
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 px-2.5 rounded-md border border-input bg-card shadow-xs cursor-pointer focus:outline-none focus:ring-[3px] focus:ring-ring text-foreground"
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
              className={`${paginationButtonClass} text-foreground`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("common.Previous","Previous")}
            </Button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={i} className="px-2 text-muted-foreground">…</span>
                ) : (
                  <Button
                    key={p}
                    size="sm"
                    onClick={() => setPageIndex(p)}
                    className={`min-w-8 px-2 ${
                      p === pageIndex
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                        : `${paginationButtonClass} text-foreground`
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
              className={`${paginationButtonClass} text-foreground`}
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
                className="h-8 w-16 px-2 rounded-md border border-input bg-card shadow-xs text-center text-sm focus:outline-none focus:ring-[3px] focus:ring-ring text-foreground"
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
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <Loader type="bars" size={36} />
    </div>
  ) : null;
}

export const EmptyState = ({ message, suggestion }: { message?: string; suggestion?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <div className="size-14 mb-4 rounded-xl bg-muted flex items-center justify-center">
      <svg
        className="size-7 text-muted-foreground"
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
    <p className="text-base font-medium text-foreground">
      {message || "No data found"}
    </p>
    {suggestion && (
      <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
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
      bg: 'bg-warning/10',
      text: 'text-amber-700 dark:text-warning',
      border: 'border-warning/30',
      label: 'Trash View',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    },
    store: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      border: 'border-border',
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
    <div className={`px-3 py-1.5 ${style.bg} border ${style.border} rounded-md ${style.text} inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
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
      className={`relative rounded-xl overflow-hidden ${!transparent ? 'bg-card' : 'bg-transparent'} ${className}`}
      id={id}
    >
      <div className={containerClassName}>
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/70">
            <TableLoader loading={true} />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}