import { useEffect, useMemo } from "react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaEye, FaEdit, FaTrash, FaPlus, FaPrint, FaFileExcel, FaSlidersH, FaFilter } from 'react-icons/fa'
import { useTranslations } from "@/hooks/useTranslations";
import Loader from "@/components/custom/Loader";
import { formatNumber } from "@/lib/helpers";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { Can } from "./Can";

/** --- RowActions Component --- **/
interface RowActionsProps<T> {
  row: T
  onDetail?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  showDetail?: boolean
  showEdit?: boolean
  showDelete?: boolean

  detailPermissions?: string[]
  editPermissions?: string[]
  deletePermissions?: string[]
}

export function RowActions<T>({
  row,
  onDetail,
  onEdit,
  onDelete,
  showDetail = true,
  showEdit = true,
  showDelete = true,
   detailPermissions = [],
  editPermissions = [],
  deletePermissions = [],
}: RowActionsProps<T>) {
  const { t } = useTranslations();
  return (
    <div className="flex gap-2 dark:text-gray-200 justify-center">
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
          {t('Showing')}{' '}
          <strong>{totalCount > 0 ? (pageIndex * pageSize + 1) : 0}</strong>{' '}
          {t('to')}{' '}
          <strong>{Math.min((pageIndex + 1) * pageSize, totalCount)}</strong>{' '}
          {t('of')}{' '}
          <strong>{totalCount}</strong>{' '}
          {t('filtered results')}
          {typeof grandTotalCount === 'number' && (
            <>
              {' '}
              ({t('total')} <strong>{grandTotalCount}</strong>)
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

/** --- TableHeaderActions Component --- **/
interface TableHeaderActionsProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onAddNew?: () => void
  onPrint?: () => void
  onExport?: () => void
  onColumnSettings?: () => void
  onFilter?: () => void
  isFilterActive?: boolean
  addButtonLabel?: string
  showSearch?: boolean
  showAddButton?: boolean
  showFilterButton?: boolean
  showPrintButton?: boolean
  showExportButton?: boolean
  showColumnSettingsButton?: boolean
}

export function TableHeaderActions({
  searchValue,
  onSearchChange,
  onAddNew,
  onPrint,
  onExport,
  onColumnSettings,
  onFilter,
  isFilterActive = false,
  addButtonLabel = 'Add New',
  showSearch = true,
  showAddButton = true,
  showFilterButton = true,
  showPrintButton = true,
  showExportButton = true,
  showColumnSettingsButton = true,
}: TableHeaderActionsProps) {
  const { t } = useTranslations();
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
      <div className="flex gap-2 relative">
        {showAddButton && onAddNew && (
          <Button
            onClick={onAddNew}
            aria-label="Add new item"
            className="btn-success-gradient flex items-center"
          >
            <FaPlus />
            <span className="hidden lg:block ml-1">{t(addButtonLabel)}</span>
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

        {showColumnSettingsButton && onColumnSettings && (
          <Button
            onClick={onColumnSettings}
            aria-label="Open column settings"
            className=""
          >
            <FaSlidersH />
            <span className="hidden lg:block ml-1">{t('Columns')}</span>
          </Button>
        )}

        {showPrintButton && onPrint && (
          <Button
            variant="info"
            onClick={onPrint}
            aria-label="Print table"
            className="bg-sky-800 hover:bg-sky-700 dark:bg-sky-800 dark:hover:bg-sky-700"
          >
            <FaPrint />
            <span className="hidden lg:block ml-1">{t('Print')}</span>
          </Button>
        )}

        {showExportButton && onExport && (
          <Button
            variant="success"
            onClick={onExport}
            className="bg-green-800 dark:bg-green-700 dark:hover:bg-green-600"
            aria-label="Export table to Excel"
          >
            <FaFileExcel />
            <span className="hidden lg:block ml-1">{t('Excel')}</span>
          </Button>
        )}
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
  setPendingPage: (value: number) => void
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
  setPendingPage,
  setPageSize,
  showRecordInfo = true,
  showPagination = true,
  showRowsPerPage = true,
}: TablePaginationFooterProps) {
  const { currentLang } = useSelector((state: RootState) => state.language);
  const { t } = useTranslations()
  const totalPage = Math.ceil(totalCount / pageSize)

  /* ------------------ Helpers ------------------ */

  // 🔢 Bangla numeral support
  

  // 📄 Responsive page button count
  const maxVisiblePages =
    typeof window !== "undefined"
      ? window.innerWidth < 640
        ? 3
        : window.innerWidth < 1024
        ? 5
        : 7
      : 5

  // 📌 Page number generator
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

  /* ------------------ Keyboard Navigation ------------------ */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!showPagination) return
      if (e.key === "ArrowLeft" && pageIndex > 0) {
        setPendingPage(pageIndex - 1)
      }
      if (e.key === "ArrowRight" && pageIndex < totalPage - 1) {
        setPendingPage(pageIndex + 1)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [pageIndex, totalPage, setPendingPage, showPagination])

  /* ------------------ Render ------------------ */

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm gap-2 dark:text-gray-200 transition-all duration-300">

      {/* 🔹 Record Info */}
      {showRecordInfo && (
        <span className="text-gray-700 dark:text-gray-200">
          {t("Showing")}{" "}
          {totalCount > 0 ? formatNumber(pageIndex * pageSize + 1, currentLang) : 0} {t("to")}{" "}
          {formatNumber(Math.min((pageIndex + 1) * pageSize, totalCount), currentLang)}{" "}
          {t("of")} {formatNumber(totalCount, currentLang)} {t("filtered results")}
          {typeof grandTotalCount === "number" && (
            <> ({t("total")} {formatNumber(grandTotalCount, currentLang)})</>
          )}
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">

        {/* 🔹 Rows per page */}
        {showRowsPerPage && (
          <>
            <label className="hidden md:block dark:text-gray-300">
              {t("Rows per page")}:
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
        {showPagination && (
          <>
            <Button
              size="sm"
              onClick={() => setPendingPage(Math.max(pageIndex - 1, 0))}
              disabled={pageIndex === 0}
              className="dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {t("Previous")}
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
                    onClick={() => setPendingPage(p)}
                    className={`min-w-[36px] transition-all duration-200 ${
                      p === pageIndex
                        ? "bg-blue-600 text-white hover:bg-blue-600"
                        : "bg-gray-200 text-blue-600 dark:text-blue-300 dark:hover:bg-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                    }`}
                  >
                    {formatNumber(p + 1, currentLang)}
                  </Button>
                )
              )}
            </div>

            <Button
              size="sm"
              onClick={() => setPendingPage(Math.min(pageIndex + 1, totalPage - 1))}
              disabled={(pageIndex + 1) * pageSize >= totalCount}
              className="dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {t("Next")}
            </Button>

            {/* 🔢 Jump to page */}
            <input
              type="number"
              min={1}
              max={totalPage}
              placeholder={t("Page")}
              className="w-16 px-2 py-1 border rounded text-center dark:bg-gray-800 dark:border-gray-700"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = Number((e.target as HTMLInputElement).value)
                  if (value >= 1 && value <= totalPage) {
                    setPendingPage(value - 1)
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
