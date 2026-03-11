import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'
import { useTable } from '@/hooks/useTable'
import { useDetailModal } from '@/hooks/useDetailModal'
import Modal from '@/components/custom/Modal'
import {
  TableLoader,
  TableHeaderActions,
  TablePaginationFooter,
  RowActions,
  IndexCell,
  EmptyState,
} from '@/components/custom/Table'
import { getCustomDateTime } from '@/lib/formatDate'
import api from '@/lib/axios'
import LogDetail from './LogDetail'
import type { IUserLog } from '@/types'
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager'
import { refreshColumnSettings } from '@/lib/refreshColumnSettings'
import { printTableById } from '@/lib/printTable'
import { exportVisibleTableToExcel } from '@/lib/exportTable'
import { FilterModal } from '@/components/custom/FilterModal'
import { LogFilterForm } from './LogFilterForm'
import type { LogFilters } from './LogFilterForm'
import { parseChanges } from '@/lib/helpers'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { ExpandableText } from '@/components/custom/ExpandableText'

// Column definitions
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  showDetail = true,
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (itemOrId: IUserLog | string) => void
  showDetail?: boolean
}): ColumnDef<IUserLog>[] => [
  { 
    header: 'SL', 
    id: 'sl', 
    cell: ({ row }) => <IndexCell rowIndex={row.index} pageIndex={pageIndex} pageSize={pageSize} />, 
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Action', 
    id: 'action', 
    cell: ({ row }) => <RowActions
      row={row.original}
      onDetail={() => fetchDetail(row.original)}
      showDetail={showDetail}
    />,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Detail', 
    id: 'detail', 
    accessorKey: 'detail', 
    meta: { customClassName: 'text-center min-w-[200px]', tdClassName: 'text-center min-w-[200px]' } 
  },
  { 
    header: 'Collection Name', 
    id: 'modelName', 
    accessorKey: 'modelName', 
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Action Type', 
    id: 'actionType', 
    accessorKey: 'actionType', 
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Object ID', 
    id: 'modelId', 
    accessorKey: 'modelId', 
    meta: { customClassName: 'text-center min-w-[150px]', tdClassName: 'text-center min-w-[150px]' } 
  },
  { 
    header: 'Created By', 
    id: 'createdByName', 
    accessorKey: 'createdByName', 
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Created At', 
    accessorKey: 'createdAt', 
    id: 'createdAt', 
    cell: ({ getValue }) => getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss'), 
    meta: { customClassName: 'text-center w-[200px]', tdClassName: 'text-center w-[200px]' } 
  },
  { 
    header: 'IP Address', 
    id: 'ipAddress', 
    accessorKey: 'ipAddress', 
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Browser', 
    id: 'browser', 
    accessorKey: 'browser', 
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Device', 
    id: 'device', 
    accessorKey: 'device', 
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'OS', 
    id: 'operatingSystem', 
    accessorKey: 'operatingSystem', 
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'User Agent', 
    id: 'userAgent', 
    accessorKey: 'userAgent', 
    meta: { customClassName: 'text-center min-w-[300px]', tdClassName: 'text-center min-w-[300px]' } 
  },
  {
    header: "Changes",
    id: "changes",
    accessorKey: "changes",
    cell: ({ getValue }) => {
      const raw = getValue();

      if (!raw) {
        return <span className="text-gray-400">-</span>;
      }

      const parsed = JSON.stringify(
        parseChanges(raw as string),
        null,
        2
      );

      return (
        <ExpandableText
          text={parsed}
          wordLimit={10}
          className="max-w-[300px] whitespace-pre-wrap break-all"
        />
      );
    },
    meta: {
      customClassName: "text-left min-w-[300px]",
      tdClassName: "align-top",
    },
  }
]

// Initial filter state
const initialFilters: LogFilters = {
  collectionName: [],
  actionType: [],
  createdBy: [],
  createdAtFrom: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
  createdAtTo: new Date(),
}

export default function LogListTable() {
  const [filters, setFilters] = useState<LogFilters>(initialFilters)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [visible, setVisible] = useState<ColumnDef<IUserLog>[]>([])

  // Refs to track state changes and prevent infinite loops
  const hasFetchedRef = useRef(false)
  const prevFiltersRef = useRef<LogFilters>(initialFilters)
  const prevPageIndexRef = useRef(0)
  const prevPageSizeRef = useRef(10)
  const prevGlobalFilterRef = useRef('')
  const prevSortingRef = useRef<SortingState>([])

  const showDetail = true
  const { isModalOpen, selectedItem, fetchDetail, closeModal, detailLoading } = useDetailModal<IUserLog>('/logs')
  const fetchDetailRef = useRef(fetchDetail)
  fetchDetailRef.current = fetchDetail

  const userId = useSelector((state: RootState) => state.auth.user?.id ?? '')

  // Stabilize fetcher using useCallback
  const stableFetcher = useCallback(
    async ({ q, page, limit, sortBy, sortOrder }: { q?: string; page: number; limit: number; sortBy?: string; sortOrder?: string }) => {
      const res = await api.post(
        '/UserLog',
        {
          q,
          page,
          limit,
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
          ...(filters.createdAtFrom && { createdAtFrom: filters.createdAtFrom }),
          ...(filters.createdAtTo && { createdAtTo: filters.createdAtTo }),
          ...(filters.collectionName?.length && { collectionName: filters.collectionName }),
          ...(filters.actionType?.length && { actionType: filters.actionType }),
          ...(filters.createdBy?.length && { createdBy: filters.createdBy }),
        },
        { withCredentials: true }
      )
      return { data: res.data.logs, total: res.data.totalCount, grandTotalCount: res.data.grandTotalCount }
    },
    [filters]
  )

  const {
    data,
    totalCount,
    grandTotalCount,
    loading,
    error,
    globalFilter,
    setGlobalFilter,
    sorting,
    setSorting,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    fetchData,
  } = useTable<IUserLog>({
    fetcher: stableFetcher,
    initialColumns: [],
    defaultSort: 'createdAt',
  })

  // Stabilize allColumns with useRef to prevent unnecessary recalculations
  const allColumnsRef = useRef<ColumnDef<IUserLog>[]>([])

  if (!allColumnsRef.current.length) {
    allColumnsRef.current = getAllColumns({
      pageIndex,
      pageSize,
      fetchDetail: (itemOrId: IUserLog | string) => fetchDetailRef.current(itemOrId),
      showDetail,
    })
  }

  const allColumns = allColumnsRef.current

  // Refresh columns only on userId
  useEffect(() => {
    if (!userId) return
    
    let mounted = true
    
    const loadColumnSettings = async () => {
      try {
        const { visibleColumns } = await refreshColumnSettings<IUserLog>('logTable', userId, allColumns)
        if (mounted) {
          setVisible(visibleColumns.length ? visibleColumns : allColumns)
        }
      } catch (err) {
        console.error('Error loading column settings:', err)
      }
    }

    loadColumnSettings()

    return () => {
      mounted = false
    }
  }, [userId, allColumns])

  // Reset pageIndex when filters change
  useEffect(() => {
    setPageIndex(0)
  }, [filters, setPageIndex])

  // Main fetch effect with change detection to prevent infinite loops
  useEffect(() => {
    // Skip if no userId
    if (!userId) return

    const shouldFetch = () => {
      // Initial fetch
      if (!hasFetchedRef.current) return true
      
      // Check if any relevant state has changed
      if (JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters)) return true
      if (prevPageIndexRef.current !== pageIndex) return true
      if (prevPageSizeRef.current !== pageSize) return true
      if (prevGlobalFilterRef.current !== globalFilter) return true
      if (JSON.stringify(prevSortingRef.current) !== JSON.stringify(sorting)) return true
      
      return false
    }

    if (shouldFetch()) {
      const controller = new AbortController()
      
      fetchData().catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Error fetching data:', err)
      })
      
      // Update refs after fetch
      hasFetchedRef.current = true
      prevFiltersRef.current = filters
      prevPageIndexRef.current = pageIndex
      prevPageSizeRef.current = pageSize
      prevGlobalFilterRef.current = globalFilter
      prevSortingRef.current = sorting
      
      // Save filters to localStorage
      localStorage.setItem('logFilters', JSON.stringify(filters))
      
      return () => controller.abort()
    }
  }, [filters, pageIndex, pageSize, globalFilter, sorting, fetchData, userId])

  const visibleIds = useMemo(
    () => visible.map(col => col.id ?? ((col as any).accessorKey ?? '')),
    [visible]
  )

  const isFilterActive = useMemo(
    () => Object.entries(filters).some(([_, value]) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    ),
    [filters]
  )

  const showEmptyState = !loading && !error && data.length === 0
  const showErrorState = !loading && error

  const table = useReactTable({
    data,
    columns: visible,
    state: { 
      sorting, 
      pagination: { pageIndex, pageSize } 
    },
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const handleApplyFilters = useCallback((newFilters: LogFilters) => {
    // Reset to first page when applying new filters
    setPageIndex(0)
    setFilters(newFilters)
    setFilterModalOpen(false)
  }, [setPageIndex])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="table-container relative space-y-2">
        <TableHeaderActions
          searchValue={globalFilter}
          onSearchChange={setGlobalFilter}
          onColumnSettings={() => setShowColumnModal(true)}
          onPrint={() => printTableById('printable-user-table', 'Log Table')}
          onExport={() =>
            exportVisibleTableToExcel({
              data,
              columns: allColumns,
              visibleColumnIds: visibleIds,
              fileName: 'Logs',
              sheetName: 'Logs',
            })
          }
          onFilter={() => setFilterModalOpen(true)}
          isFilterActive={isFilterActive}
        />

        <div className="relative rounded-sm shadow overflow-hidden bg-white dark:bg-gray-800" id="printable-user-table">
          <div className="max-h-[600px] min-h-[200px] overflow-y-auto">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-opacity-70 mt-20">
                <TableLoader loading />
              </div>
            )}

            {showErrorState && (
              <EmptyState
                message="Error loading logs"
                suggestion="Please try again or contact support"
              />
            )}

            {showEmptyState && (
              <EmptyState
                message="No logs found"
                suggestion="Try adjusting your filters"
              />
            )}

            {!showEmptyState && !showErrorState && (
              <table className="table-auto w-full text-left border border-collapse">
                <thead className="sticky -top-1 z-10 bg-gray-200 dark:bg-gray-700">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className={`p-2 border ${header.column.columnDef.meta?.customClassName || ''}`}>
                          <div
                            className="flex justify-between items-center w-full cursor-pointer"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="flex-1 text-center">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            <span className="ml-2">
                              {header.column.getIsSorted() === 'asc' ? (
                                <FaSortUp size={12} />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <FaSortDown size={12} />
                              ) : (
                                <FaSort size={12} />
                              )}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <motion.tbody
                  key={pageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="border-b dark:border-gray-700">
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className={`p-2 border ${cell.column.columnDef.meta?.tdClassName || ''}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </motion.tbody>
              </table>
            )}
          </div>
        </div>

        {!showEmptyState && !showErrorState && totalCount > 0 && (
          <TablePaginationFooter
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalCount={totalCount}
            grandTotalCount={grandTotalCount}
            setPageIndex={setPageIndex}
            setPageSize={setPageSize}
          />
        )}
      </div>

      {showDetail && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title="Log Details" widthPercent={80}>
          {detailLoading || !selectedItem ? (
            <TableLoader loading />
          ) : (
            <LogDetail
              log={{
                detail: selectedItem.detail ?? '',
                collectionName: selectedItem.modelName ?? '',
                actionType: selectedItem.actionType ?? '',
                objectId: selectedItem.modelId ?? '',
                createdByName: selectedItem.createdByName ?? '',
                createdAt: selectedItem.createdAt ?? '',
                ipAddress: selectedItem.ipAddress ?? '',
                browser: selectedItem.browser ?? '',
                device: selectedItem.device ?? '',
                operatingSystem: selectedItem.operatingSystem ?? '',
                userAgent: selectedItem.userAgent ?? '',
                changes: parseChanges(selectedItem.changes ?? ''), 
              }}
            />
          )}
        </Modal>
      )}

      {showColumnModal && (
        <ColumnVisibilityManager<IUserLog>
          tableId="logTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      <FilterModal
        tableId="logTable"
        title="Filter Logs"
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        renderForm={(filterValues, setFilterValues, resetRef) => (
          <LogFilterForm 
            filterValues={filterValues} 
            setFilterValues={setFilterValues} 
            onClose={() => setFilterModalOpen(false)} 
            onResetRef={resetRef} 
          />
        )}
      />
    </motion.div>
  )
}