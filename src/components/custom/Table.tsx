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
    const { rows } = table.getCoreRowModel()
    
    // Get only selectable rows (non-developer users)
    const selectableRows = rows.filter((row: Row<TData>) => {
      const user = row.original as any
      const hasDeveloperRole = user.roles?.includes('developer') || 
                                user.roleNames?.split(',').map((r: string) => r.trim()).includes('developer')
      return !hasDeveloperRole
    })
    
    const isAllSelectableSelected = selectableRows.length > 0 && 
      selectableRows.every((row: Row<TData>) => row.getIsSelected())
    const isSomeSelectableSelected = selectableRows.some((row: Row<TData>) => row.getIsSelected())
    
    return (
      <div 
        className="flex justify-center cursor-pointer"
        onClick={() => {
          if (isAllSelectableSelected) {
            // Unselect all selectable rows
            selectableRows.forEach((row: Row<TData>) => row.toggleSelected(false))
          } else {
            // Select all selectable rows
            selectableRows.forEach((row: Row<TData>) => row.toggleSelected(true))
          }
        }}
      >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
          isAllSelectableSelected 
            ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
            : isSomeSelectableSelected 
              ? 'bg-blue-200 border-blue-400 dark:bg-blue-800 dark:border-blue-600' 
              : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-900'
        }`}>
          {isAllSelectableSelected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {!isAllSelectableSelected && isSomeSelectableSelected && (
            <div className="w-2 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </div>
      </div>
    )
}

/** --- RowActions Component with Permanent Delete --- **/
interface RowActionsProps<T> {
  row: T
  onDetail?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onRestore?: (row: T) => void
  onPermanentDelete?: (row: T) => void  // NEW: Permanent delete
  showDetail?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showRestore?: boolean
  showPermanentDelete?: boolean  // NEW: Show permanent delete button
  detailPermissions?: string[]
  editPermissions?: string[]
  deletePermissions?: string[]
  restorePermissions?: string[]
  permanentDeletePermissions?: string[]  // NEW
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
          <Button size="sm" variant="info" onClick={() => onDetail(row)}>
            <FaEye />
            <span className="hidden md:block">{t("Detail")}</span>
          </Button>
        </Can>
      )}

      {showEdit && onEdit && (
        <Can anyOf={editPermissions}>
          <Button size="sm" variant="warning" onClick={() => onEdit(row)}>
            <FaEdit />
            <span className="hidden md:block">{t("Edit")}</span>
          </Button>
        </Can>
      )}

      {showDelete && onDelete && (
        <Can anyOf={deletePermissions}>
          <Button size="sm" variant="destructive" onClick={() => onDelete(row)}>
            <FaTrash />
            <span className="hidden md:block">{t("Delete")}</span>
          </Button>
        </Can>
      )}

      {showRestore && onRestore && (
        <Can anyOf={restorePermissions}>
          <Button size="sm" variant="success" onClick={() => onRestore(row)}>
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
            className="bg-red-700 hover:bg-red-800"
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
    <span className="text-sm text-gray-700 dark:text-gray-200">
      {typeof pageIndex === 'number' &&
      typeof pageSize === 'number' &&
      typeof totalCount === 'number' && (
        <>
          {t('common.Showing','Showing')}{' '}
          <strong>{totalCount > 0 ? (pageIndex * pageSize + 1) : 0}</strong>{' '}
          {t('common.to','To')}{' '}
          <strong>{Math.min((pageIndex + 1) * pageSize, totalCount)}</strong>{' '}
          {t('common.of','Of')}{' '}
          <strong>{totalCount}</strong>{' '}
          {t('filtered results','filtered results')}{' '}
          {typeof grandTotalCount === 'number' && (
            <>
              {' '}
              ({t('common.total','Total')} <strong>{grandTotalCount}</strong>)
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
  return <span className="text-gray-800 dark:text-gray-200">{rowIndex + 1 + pageIndex * pageSize}</span>
}

// Update TableHeaderActions component
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
  selectedCount = 0,
  trashButton,
  storeButton,
}: TableHeaderActionsProps) {
  const { t } = useTranslations();
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-between gap-3 mb-4 dark:text-gray-200">
      {showSearch &&
        <Input
          aria-label="Search"
          placeholder={t("Search") + "..."}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-[220px] md:w-1/3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />
      }
      <div className="flex gap-2 relative flex-wrap">
        {showAddButton && onAddNew && (
          <Button
            onClick={onAddNew}
            aria-label="Add new item"
            className="btn-success-gradient flex items-center"
          >
            <FaPlus />
            <span className="hidden lg:block ml-1">{t(addButtonLabel,'Add New')}</span>
          </Button>
        )}

        {showFilterButton && onFilter && (
          <Button
            onClick={onFilter}
            aria-label="Open filter modal"
            className="relative bg-blue-900 hover:bg-blue-800 dark:bg-blue-800 dark:hover:bg-blue-700"
          >
            <FaFilter />
            <span className="hidden lg:block ml-1">{t('Filter')}</span>

            {isFilterActive && (
              <span
                className="absolute top-1 right-1 w-1 h-1 rounded-full bg-red-500 dark:bg-red-400"
                aria-hidden="true"
              />
            )}
          </Button>
        )}

        {/* Bulk Actions - Always show but disabled when no selection */}
        {showBulkActions && (
          <>
            {/* Bulk Restore - visible in Trash View (Store button visible) */}
            {storeButton?.show && onBulkRestore && (
              <Button
                onClick={onBulkRestore}
                disabled={!hasSelection}
                aria-label="Bulk restore selected items"
                variant="success"
                className={`flex items-center whitespace-nowrap ${
                  hasSelection 
                    ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <FaTrashRestore className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('Bulk Restore')} {hasSelection && `(${selectedCount})`}</span>
              </Button>
            )}
            
            {/* Bulk Delete (Move to Trash) - visible in Store View (Trash button visible) */}
            {!storeButton?.show && trashButton?.show && onBulkDelete && (
              <Button
                onClick={onBulkDelete}
                disabled={!hasSelection}
                aria-label="Bulk move to trash"
                variant="destructive"
                className={`flex items-center whitespace-nowrap ${
                  hasSelection 
                    ? 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <FaTrash className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('Bulk Delete')} {hasSelection && `(${selectedCount})`}</span>
              </Button>
            )}
            
            {/* Bulk Permanent Delete - visible in Trash View (Trash button visible) */}
            {storeButton?.show && onBulkPermanentDelete && (
              <Button
                onClick={onBulkPermanentDelete}
                disabled={!hasSelection}
                aria-label="Bulk permanently delete selected items"
                variant="destructive"
                className={`flex items-center whitespace-nowrap ${
                  hasSelection 
                    ? 'bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <FaTrash className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('Bulk Permanent Delete')} {hasSelection && `(${selectedCount})`}</span>
              </Button>
            )}
          </>
        )}

        {/* Trash Button - shown when not in trash view */}
        {showTrashButton && trashButton?.show && trashButton.onClick && (
          <Button
            onClick={trashButton.onClick}
            aria-label="View deleted items"
            variant="destructive"
            className="flex items-center whitespace-nowrap bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">{trashButton.label || t('Trash')}</span>
          </Button>
        )}

        {/* Store Button - shown when in trash view */}
        {storeButton?.show && storeButton.onClick && (
          <Button
            onClick={storeButton.onClick}
            aria-label="View active items"
            variant="success"
            className="flex items-center whitespace-nowrap bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="flex items-center gap-1"
              aria-label="More actions"
            >
              <FaEllipsisH className="w-3 h-3" />
              <span className="hidden lg:block">{t('More')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {showPrintButton && onPrint && (
              <DropdownMenuItem 
                onClick={onPrint} 
                className="cursor-pointer hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/50 dark:hover:text-sky-300 transition-colors duration-200"
              >
                <FaPrint className="w-4 h-4 mr-2 text-sky-600 dark:text-sky-400" />
                <span>{t('Print')}</span>
              </DropdownMenuItem>
            )}
            {showExportButton && onExport && (
              <DropdownMenuItem 
                onClick={onExport} 
                className="cursor-pointer hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/50 dark:hover:text-green-300 transition-colors duration-200"
              >
                <FaFileExcel className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                <span>{t('Excel')}</span>
              </DropdownMenuItem>
            )}
            {showColumnSettingsButton && onColumnSettings && (
              <DropdownMenuItem 
                onClick={onColumnSettings} 
                className="cursor-pointer hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 transition-colors duration-200"
              >
                <FaSlidersH className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
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
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY - BEFORE ANY EARLY RETURNS
  const { currentLang } = useSelector((state: RootState) => state.language);
  const { t } = useTranslations()
  
  // Calculate total pages (this is not a hook, it's fine)
  const totalPage = Math.ceil(totalCount / pageSize)

  // 📄 Responsive page button count (this is not a hook either)
  const maxVisiblePages =
    typeof window !== "undefined"
      ? window.innerWidth < 640
        ? 3
        : window.innerWidth < 1024
        ? 5
        : 7
      : 5

  // 📌 Page number generator - THIS IS A HOOK (useMemo)
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

  /* ------------------ Keyboard Navigation - THIS IS A HOOK (useEffect) ------------------ */
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

  // NOW we can conditionally return based on data (after all hooks)
  // Don't show pagination if there's no data
  if (totalCount === 0) return null

  /* ------------------ Render ------------------ */
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm gap-2 dark:text-gray-200 transition-all duration-300">
      {/* 🔹 Record Info */}
      {showRecordInfo && (
        <span className="text-gray-700 dark:text-gray-200">
          {t("common.Showing","Showing")}{" "}
          {totalCount > 0 ? formatNumber(pageIndex * pageSize + 1, currentLang) : 0} {t("common.To","To")}{" "}
          {formatNumber(Math.min((pageIndex + 1) * pageSize, totalCount), currentLang)}{" "}
          {t("common.Of","Of")} {formatNumber(totalCount, currentLang)} {t("common.filtered_results","filtered results")}{" "}
          {typeof grandTotalCount === "number" && grandTotalCount > 0 && (
            <> ({t("common.total","Total")} {formatNumber(grandTotalCount, currentLang)})</>
          )}
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* 🔹 Rows per page */}
        {showRowsPerPage && (
          <>
            <label className="hidden md:block dark:text-gray-300">
              {t("common.Rows_per_page","Rows per page")}:
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 cursor-pointer dark:bg-gray-800 dark:border-gray-700"
            >
              {[10, 50, 100, 500, 1000, 5000].map(size => (
                <option key={size} value={size}>
                  {formatNumber(size, currentLang)}
                </option>
              ))}
            </select>
          </>
        )}

        {/* 🔹 Pagination */}
        {showPagination && totalPage > 1 && (
          <>
            <Button
              size="sm"
              onClick={() => setPageIndex(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {t("common.Previous","Previous")}
            </Button>

            {/* 🔢 Page Numbers */}
            <div className="flex items-center gap-1">
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={i} className="px-2 text-gray-500">…</span>
                ) : (
                  <Button
                    key={p}
                    size="sm"
                    onClick={() => setPageIndex(p)}
                    className={`min-w-[36px] transition-all duration-200 ${
                      p === pageIndex
                        ? "bg-blue-600 text-white hover:bg-blue-600"
                        : "bg-gray-200 text-blue-600 dark:text-blue-300 dark:hover:bg-gray-700 hover:bg-gray-300 dark:bg-gray-800"
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
              className="dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {t("common.Next","Next")}
            </Button>

            {/* 🔢 Jump to page */}
            <input
              type="number"
              min={1}
              max={totalPage}
              placeholder={t("common.Page","Page")}
              className="w-16 px-2 py-1 border rounded text-center dark:bg-gray-800 dark:border-gray-700"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = Number((e.target as HTMLInputElement).value)
                  if (value >= 1 && value <= totalPage) {
                    setPageIndex(value - 1)
                  }
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}


/** --- TableLoader Component --- **/
export function TableLoader({ loading }: { loading: boolean }) {
  return loading ? (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-black/60">
      <Loader type="bars" size={48} />
    </div>
  ) : null;
}

export const EmptyState = ({ message, suggestion }: { message?: string; suggestion?: string }) => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
    <svg
      className="w-16 h-16 mb-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
      {message || "No data found"}
    </p>
    {suggestion && (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {suggestion}
      </p>
    )}
  </div>
)

// components/custom/TrashViewIndicator.tsx
interface ViewIndicatorConfig {
  type: 'trash' | 'store'
  message: string
}

// components/custom/TrashViewIndicator.tsx
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
      bg: 'bg-orange-100 dark:bg-orange-900/30',
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
      bg: 'bg-blue-100 dark:bg-blue-900/30',
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
    <div className={`px-2 py-1 ${style.bg} border ${style.border} rounded-md ${style.text} inline-flex items-center text-xs font-medium ${className}`}>
      {style.icon}
      <span className="ml-1">{style.label}</span>
    </div>
  )
}

interface TableWithLoaderProps {
  loading: boolean
  children: ReactNode
  className?: string
  id?: string
  containerClassName?: string
}

export function TableWithLoader({ 
  loading, 
  children, 
  className = '',
  id,
  containerClassName = 'max-h-[600px] min-h-[200px] overflow-y-auto relative'
}: TableWithLoaderProps) {
  return (
    <div 
      className={`relative rounded-sm shadow overflow-hidden bg-white dark:bg-gray-800 ${className}`}
      id={id}
    >
      <div className={containerClassName}>
        {/* Loader - overlays on top of content when loading */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/0 dark:bg-gray-900/0">
            <TableLoader loading={true} />
          </div>
        )}

        {/* Content - always rendered, may be covered by loader */}
        {children}
      </div>
    </div>
  )
}