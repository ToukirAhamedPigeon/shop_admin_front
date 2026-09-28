// src/modules/settings/user-logs/components/UserLogs.tsx
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
import { List, Rows3 } from 'lucide-react'
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
  ErrorState,
  TableWithLoader,
} from '@/components/custom/Table'
import { getCustomDateTime } from '@/lib/formatDate'
import api from '@/lib/axios'
import LogDetail from './LogDetail'
import LogTimeline, { TimelineSkeleton } from './LogTimeline'
import { QUICK_FILTERS, actionOf, toneSoft } from './logMeta'
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
    cell: ({ getValue }) => <span className="text-foreground/80">{getValue() as string}</span>,
    meta: { customClassName: 'text-center min-w-[200px]', tdClassName: 'text-center min-w-[200px]' } 
  },
  { 
    header: 'Collection Name', 
    id: 'modelName', 
    accessorKey: 'modelName',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
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
      const value = getValue() as string
      const action = actionOf(value)
      return (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', toneSoft[action.tone])}>
          {value}
        </span>
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Object ID', 
    id: 'modelId', 
    accessorKey: 'modelId',
    cell: ({ getValue }) => <span className="font-mono text-sm text-primary">{getValue() as string}</span>,
    meta: { customClassName: 'text-center min-w-[150px]', tdClassName: 'text-center min-w-[150px]' } 
  },
  { 
    header: 'Created By', 
    id: 'createdByName', 
    accessorKey: 'createdByName',
    cell: ({ getValue }) => <span className="font-medium text-foreground/80">{getValue() as string}</span>,
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
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'Device', 
    id: 'device', 
    accessorKey: 'device',
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'OS', 
    id: 'operatingSystem', 
    accessorKey: 'operatingSystem',
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' } 
  },
  { 
    header: 'User Agent', 
    id: 'userAgent', 
    accessorKey: 'userAgent',
    cell: ({ getValue }) => <span className="text-muted-foreground text-sm truncate max-w-[300px] block" title={getValue() as string}>{getValue() as string}</span>,
    meta: { customClassName: 'text-center min-w-[300px]', tdClassName: 'text-center min-w-[300px]' } 
  },
  {
    header: "Changes",
    id: "changes",
    accessorKey: "changes",
    cell: ({ getValue }) => {
      const raw = getValue();

      if (!raw) {
        return <span className="text-muted-foreground">-</span>;
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

type LogView = 'timeline' | 'table'
const VIEW_KEY = 'user-logs-view'
const readView = (): LogView => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'timeline'
  } catch {
    return 'timeline'
  }
}

const sameTypes = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every(t => b.includes(t))

export default function LogListTable() {
  const [filters, setFilters] = useState<LogFilters>(initialFilters)
  const [view, setView] = useState<LogView>(readView)
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
    minLoadingTime: 300,
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

  const changeView = (next: LogView) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      /* private mode: kept for this visit only */
    }
  }

  const activeQuick = QUICK_FILTERS.find(q => sameTypes(q.types, filters.actionType ?? []))?.id

  const handleApplyFilters = useCallback((newFilters: LogFilters) => {
    // Reset to first page when applying new filters
    setPageIndex(0)
    setFilters(newFilters)
    setFilterModalOpen(false)
  }, [setPageIndex])

  return (
    <div>
      <div className="table-container relative space-y-3">
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

        {/* Quick action filters and the view switch */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="radiogroup" aria-label="Show actions" className="flex flex-wrap gap-1.5">
            {QUICK_FILTERS.map(q => {
              const active = activeQuick === q.id
              return (
                <button
                  key={q.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleApplyFilters({ ...filters, actionType: q.types })}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {q.label}
                </button>
              )
            })}
          </div>
          <div role="radiogroup" aria-label="View" className="flex rounded-lg border border-border bg-muted/50 p-0.5">
            {([
              ['timeline', Rows3, 'Timeline'],
              ['table', List, 'Table'],
            ] as const).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={view === mode}
                onClick={() => changeView(mode)}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  view === mode ? 'bg-card font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* TIMELINE */}
        {view === 'timeline' && (
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4">
            {showErrorState ? (
              <ErrorState
                message="Couldn't load logs"
                suggestion="The server didn't respond as expected. Check your connection and try again."
                onRetry={() => fetchData()}
              />
            ) : showEmptyState ? (
              <EmptyState message="No activity found" suggestion="Try another filter or date range" />
            ) : data.length === 0 ? (
              <TimelineSkeleton />
            ) : (
              <div className={cn('max-h-[680px] overflow-y-auto transition-opacity duration-200', loading && 'opacity-60')} aria-busy={loading}>
                <LogTimeline logs={data} onOpen={log => fetchDetail(log)} />
              </div>
            )}
          </div>
        )}

        {/* TABLE: stays in the page in timeline view, hidden, so Print still has it. */}
        <div className={cn('relative rounded-xl overflow-hidden border border-border bg-card shadow-xs', view !== 'table' && 'hidden')}>
          <TableWithLoader 
            loading={loading}
            id="printable-user-table"
            containerClassName="max-h-[600px] min-h-[200px] overflow-auto relative"
          >
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-border">
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap bg-muted ${header.column.columnDef.meta?.customClassName || ''}`}
                      >
                        <div
                          className="flex justify-between items-center w-full gap-2 cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="flex-1 text-center">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <span className="relative">
                            {header.column.getIsSorted() === 'asc' ? (
                              <FaSortUp className="text-primary" size={12} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <FaSortDown className="text-primary" size={12} />
                            ) : (
                              <FaSort className="text-muted-foreground/50" size={10} />
                            )}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              
              <tbody>
                {/* Error State Row - only show when not loading */}
                {showErrorState && (
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className="p-0">
                      <ErrorState
                        message="Couldn't load logs"
                        suggestion="The server didn't respond as expected. Check your connection and try again."
                        onRetry={() => fetchData()}
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
                          'transition-colors',
                          index !== table.getRowModel().rows.length - 1 && 'border-b border-border',
                          'hover:bg-accent/50'
                        )}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className={`px-4 py-3 text-sm text-foreground/90 ${cell.column.columnDef.meta?.tdClassName || ''}`}
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
              </tbody>
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
        <Modal isOpen={isModalOpen} onClose={closeModal} title="Log details" widthPercent={70}>
          {detailLoading || !selectedItem ? (
            <TableLoader loading />
          ) : (
            <LogDetail log={selectedItem} />
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
    </div>
  )
}