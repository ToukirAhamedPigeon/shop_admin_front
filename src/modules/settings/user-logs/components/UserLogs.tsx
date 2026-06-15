// app/(dashboard)/admin/logs/LogListTable.tsx
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
  TableWithLoader,
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
import { can } from '@/lib/authCheck'
import { useAppSelector } from '@/hooks/useRedux'
import { cn } from '@/lib/utils'

// Column definitions with enhanced styling
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
    cell: ({ getValue }) => <span className="text-gray-700 dark:text-gray-300">{getValue() as string}</span>,
    meta: { customClassName: 'text-center min-w-[200px]', tdClassName: 'text-center min-w-[200px]' } 
  },
  { 
    header: 'Collection Name', 
    id: 'modelName', 
    accessorKey: 'modelName',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200 shadow-sm">
          {value}
        </span>
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Action Type', 
    id: 'actionType', 
    accessorKey: 'actionType',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      const getActionColor = () => {
        switch(value?.toLowerCase()) {
          case 'create': return 'text-green-600 dark:text-green-400';
          case 'update': return 'text-blue-600 dark:text-blue-400';
          case 'delete': return 'text-red-600 dark:text-red-400';
          default: return 'text-gray-600 dark:text-gray-400';
        }
      };
      return <span className={`font-medium ${getActionColor()}`}>{value}</span>
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Object ID', 
    id: 'modelId', 
    accessorKey: 'modelId',
    cell: ({ getValue }) => <span className="font-mono text-sm text-purple-600 dark:text-purple-400">{getValue() as string}</span>,
    meta: { customClassName: 'text-center min-w-[150px]', tdClassName: 'text-center min-w-[150px]' } 
  },
  { 
    header: 'Created By', 
    id: 'createdByName', 
    accessorKey: 'createdByName',
    cell: ({ getValue }) => <span className="font-medium text-gray-700 dark:text-gray-300">{getValue() as string}</span>,
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
    cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Browser', 
    id: 'browser', 
    accessorKey: 'browser',
    cell: ({ getValue }) => <span className="text-gray-600 dark:text-gray-400">{getValue() as string}</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Device', 
    id: 'device', 
    accessorKey: 'device',
    cell: ({ getValue }) => <span className="text-gray-600 dark:text-gray-400">{getValue() as string}</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'OS', 
    id: 'operatingSystem', 
    accessorKey: 'operatingSystem',
    cell: ({ getValue }) => <span className="text-gray-600 dark:text-gray-400">{getValue() as string}</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'User Agent', 
    id: 'userAgent', 
    accessorKey: 'userAgent',
    cell: ({ getValue }) => <span className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-[300px] block" title={getValue() as string}>{getValue() as string}</span>,
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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark'

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

  const userId = useSelector((state: RootState) => (state.auth as { user: { id: string } })?.user?.id ?? '')
  
  // Check if user has permission to read all logs
  const hasReadAllPermission = can(['read-admin-all-user-logs'])

  // Stabilize fetcher using useCallback
  const stableFetcher = useCallback(
    async ({ q, page, limit, sortBy, sortOrder }: { q?: string; page: number; limit: number; sortBy?: string; sortOrder?: string }) => {
      const payload: any = {
        q,
        page,
        limit,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        ...(filters.createdAtFrom && { createdAtFrom: filters.createdAtFrom }),
        ...(filters.createdAtTo && { createdAtTo: filters.createdAtTo }),
        ...(filters.collectionName?.length && { collectionName: filters.collectionName }),
        ...(filters.actionType?.length && { actionType: filters.actionType }),
      }
      
      // If user doesn't have read-all-logs permission, only show their own logs
      if (!hasReadAllPermission && userId) {
        payload.createdBy = [userId]
      } else if (hasReadAllPermission && filters.createdBy?.length) {
        // If user has permission and filters are applied, use the selected users
        payload.createdBy = filters.createdBy
      }
      
      const res = await api.post(
        '/UserLog',
        payload,
        { withCredentials: true }
      )
      return { data: res.data.logs, total: res.data.totalCount, grandTotalCount: res.data.grandTotalCount }
    },
    [filters, hasReadAllPermission, userId]
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
    minLoadingTime: 1000,
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

  // Don't show empty state on initial load or when loading
  const showEmptyState = !error && data.length === 0 && hasFetchedRef.current && !loading
  const showErrorState = !!error && !loading

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

        {/* TABLE - Glass Design */}
        <div className="relative rounded-xl overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
          <TableWithLoader 
            loading={loading}
            id="printable-user-table"
            containerClassName="max-h-[600px] min-h-[200px] overflow-auto relative"
          >
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-gray-200/50 dark:border-gray-700/50">
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        className={`p-4 text-center font-semibold ${header.column.columnDef.meta?.customClassName || ''}`}
                        style={{
                          background: isDarkMode
                            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                            : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <div
                          className="flex justify-between items-center w-full gap-2 cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="flex-1 text-center text-gray-800 dark:text-gray-200 font-semibold">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <span className="relative">
                            {header.column.getIsSorted() === 'asc' ? (
                              <FaSortUp className="text-purple-600 dark:text-purple-400" size={12} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <FaSortDown className="text-purple-600 dark:text-purple-400" size={12} />
                            ) : (
                              <FaSort className="text-gray-500 dark:text-gray-500" size={12} />
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
                {/* Error State Row - only show when not loading */}
                {showErrorState && (
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className="p-0">
                      <EmptyState
                        message="Error loading logs"
                        suggestion="Please try again or contact support"
                      />
                    </td>
                  </tr>
                )}

                {/* Empty State Row - only show when not loading and after initial fetch */}
                {!showErrorState && showEmptyState && (
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className="p-0">
                      <EmptyState
                        message="No logs found"
                        suggestion="Try adjusting your filters"
                      />
                    </td>
                  </tr>
                )}

                {/* Data Rows - show when we have data and no error */}
                {!showErrorState && !showEmptyState && data.length > 0 && (
                  <>
                    {table.getRowModel().rows.map((row, index) => (
                      <tr 
                        key={row.id} 
                        className={cn(
                          "transition-all duration-200",
                          "border-b border-gray-200/40 dark:border-gray-700/30",
                          index !== table.getRowModel().rows.length - 1 && "border-b",
                          "hover:bg-white/20 dark:hover:bg-white/5"
                        )}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className={`p-4 text-gray-700 dark:text-gray-300 ${cell.column.columnDef.meta?.tdClassName || ''}`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}

                {/* Show empty tbody when loading or no data but haven't reached empty state yet */}
                {!showErrorState && !showEmptyState && data.length === 0 && (
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className="h-32" />
                  </tr>
                )}
              </motion.tbody>
            </table>
          </TableWithLoader>
        </div>

        {!showErrorState && !showEmptyState && totalCount > 0 && (
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