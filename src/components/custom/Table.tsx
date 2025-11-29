import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaEye, FaEdit, FaTrash, FaPlus, FaPrint, FaFileExcel, FaSlidersH, FaFilter } from 'react-icons/fa'
import { useTranslations } from "@/hooks/useTranslations";
import Loader from "@/components/custom/Loader";

/** --- RowActions Component --- **/
interface RowActionsProps<T> {
  row: T
  onDetail?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  showDetail?: boolean
  showEdit?: boolean
  showDelete?: boolean
}

export function RowActions<T>({ row, onDetail, onEdit, onDelete, showDetail=true, showEdit=true, showDelete=true }: RowActionsProps<T>) {
  const { t } = useTranslations();
  return (
    <div className="flex gap-2">
      {showDetail && onDetail && (
        <Button size="sm" variant="info" onClick={() => onDetail(row)}>
          <FaEye /> <span className="hidden md:block">{t('Detail')}</span>
        </Button>
      )}
      {showEdit && onEdit && (
        <Button size="sm" variant="warning" onClick={() => onEdit(row)}>
          <FaEdit /> <span className="hidden md:block">{t('Edit')}</span>
        </Button>
      )}
      {showDelete && onDelete && (
        <Button size="sm" variant="destructive" onClick={() => onDelete(row)}>
          <FaTrash /> <span className="hidden md:block">{t('Delete')}</span>
        </Button>
      )}
    </div>
  )
}

/** --- RecordInfo Component --- **/
interface RecordInfoProps {
  pageIndex: number
  pageSize: number
  totalCount: number
}

export function RecordInfo({ pageIndex, pageSize, totalCount }: RecordInfoProps) {
  const { t } = useTranslations();
  return (
    <span>
      {t('Showing')} {(pageIndex && pageSize) ? `${pageIndex * pageSize + 1} ${t('to')} ${Math.min((pageIndex + 1) * pageSize, totalCount)}` : ''} {t('Total')} {totalCount}
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
  return <>{rowIndex + 1 + pageIndex * pageSize}</>
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
  showSearch= true,
  showAddButton= true,
  showFilterButton= true,
  showPrintButton= true,
  showExportButton= true,
  showColumnSettingsButton= true,
}: TableHeaderActionsProps) {
  const { t } = useTranslations();
  return (
    <div className="flex justify-between items-center mb-4">
      {showSearch && 
        <Input
          aria-label="Search"
          placeholder={t("Search")+"..."}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-[120px] md:w-1/3"
        />
      }
      <div className="flex gap-2 relative">
        {showAddButton && onAddNew && (
          <Button variant="success" onClick={onAddNew} aria-label="Add new item">
            <FaPlus />
            <span className="hidden lg:block ml-1">{t(addButtonLabel)}</span>
          </Button>
        )}

        {showFilterButton && onFilter && (
          <Button
            onClick={onFilter}
            aria-label="Open filter modal"
            className="relative bg-blue-900 hover:bg-blue-800"
          >
            <FaFilter />
            <span className="hidden lg:block ml-1">{t('Filter')}</span>

            {/* Indicator dot */}
            {isFilterActive && (
              <span
                className="absolute top-1 right-1 w-1 h-1 rounded-full bg-red-500"
                aria-hidden="true"
              />
            )}
          </Button>
        )}

        {showColumnSettingsButton && onColumnSettings && (
          <Button onClick={onColumnSettings} aria-label="Open column settings">
            <FaSlidersH />
            <span className="hidden lg:block ml-1">{t('Columns')}</span>
          </Button>
        )}
        {showPrintButton && onPrint && (
          <Button
            variant="info"
            onClick={onPrint}
            className=""
            aria-label="Print table"
          >
            <FaPrint />
            <span className="hidden lg:block ml-1">{t('Print')}</span>
          </Button>
        )}
        {showExportButton && onExport && (
          <Button
            variant="success"
            onClick={onExport}
            className="bg-green-800"
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

/** --- TablePaginationFooter Component --- **/
interface TablePaginationFooterProps {
  pageIndex: number
  pageSize: number
  totalCount: number
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
  setPageIndex,
  setPageSize,
  showRecordInfo = true,
  showPagination = true,
  showRowsPerPage = true,
}: TablePaginationFooterProps) {
  const { t } = useTranslations();
  const totalPage = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm gap-2">
      {showRecordInfo && <RecordInfo pageIndex={pageIndex} pageSize={pageSize} totalCount={totalCount} />}

      <div className="flex items-center gap-2">
        {showRowsPerPage && (<>
        <label htmlFor="pageSize" className="hidden md:block">
          {t('Rows per page')}:
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border rounded px-2 py-1 cursor-pointer"
        >
          {[10, 50, 100, 500, 1000, 5000].map((size) => (
            <option key={size} value={size} className="dark:bg-gray-800 cursor-pointer">
              {size}
            </option>
          ))}
        </select>
        </>)}

        {showPagination && (
          <>
          <Button size="sm" onClick={() => setPageIndex(Math.max(pageIndex - 1, 0))} disabled={pageIndex === 0}>
            {t('Previous')}
          </Button>

          <Button
            size="sm"
            onClick={() => setPageIndex(Math.min(pageIndex + 1, totalPage - 1))}
            disabled={(pageIndex + 1) * pageSize >= totalCount}
          >
            {t('Next')}
          </Button>
          </>
        )}
      </div>
    </div>
  )
}

/** --- TableLoader Component --- **/
export function TableLoader({ loading }: { loading: boolean }) {
  return loading ? (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
      <Loader type="bars" size={48} />
    </div>
  ) : null;
}


