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
  { header: 'SL', id: 'sl', cell: ({ row }) => <IndexCell rowIndex={row.index} pageIndex={pageIndex} pageSize={pageSize} />, meta: { customClassName: 'text-center' } },
  { header: 'Action', id: 'action', cell: ({ row }) => <RowActions row={row.original} onDetail={() => fetchDetail(row.original)} showDetail={showDetail} /> },
  { header: 'Detail', id: 'detail', accessorKey: 'detail' },
  { header: 'Collection Name', id: 'modelName', accessorKey: 'modelName' },
  { header: 'Action Type', id: 'actionType', accessorKey: 'actionType' },
  { header: 'Object ID', id: 'modelId', accessorKey: 'modelId' },
  { header: 'Created By', id: 'createdByName', accessorKey: 'createdByName' },
  { header: 'Created At', accessorKey: 'createdAt', id: 'createdAt', cell: ({ getValue }) => getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss'), meta: { customClassName: 'text-center min-w-[150px] whitespace-nowrap' } },
  { header: 'IP Address', id: 'ipAddress', accessorKey: 'ipAddress' },
  { header: 'Browser', id: 'browser', accessorKey: 'browser' },
  { header: 'Device', id: 'device', accessorKey: 'device' },
  { header: 'OS', id: 'operatingSystem', accessorKey: 'operatingSystem' },
  { header: 'User Agent', id: 'userAgent', accessorKey: 'userAgent' },
  { header: 'Changes', id: 'changes', accessorKey: 'changes', cell: ({ getValue }) => <pre className="whitespace-pre-wrap">{JSON.stringify(parseChanges(getValue() as string), null, 2)}</pre> },
]

// Initial filter state
const initialFilters: LogFilters = {
  collectionName: [],
  actionType: [],
  createdBy: [],
  createdAtFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  createdAtTo: new Date(),
}

export default function LogListTable() {
  const [filters, setFilters] = useState<LogFilters>(initialFilters)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [visible, setVisible] = useState<ColumnDef<IUserLog>[]>([])

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
          ...(filters.collectionName && { collectionName: filters.collectionName }),
          ...(filters.actionType && { actionType: filters.actionType }),
          ...(filters.createdBy.length > 0 && { createdBy: filters.createdBy }),
        },
        { withCredentials: true }
      )
      return { data: res.data.logs, total: res.data.totalCount }
    },
    [filters] // only changes when filters change
  )

  const {
    data,
    totalCount,
    loading,
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

  const allColumns = useMemo(
    () =>
      getAllColumns({
        pageIndex,
        pageSize,
        fetchDetail: (itemOrId: IUserLog | string) => fetchDetailRef.current(itemOrId),
        showDetail,
      }),
    [pageIndex, pageSize, showDetail]
  )

  // Refresh columns only on userId
  useEffect(() => {
    if (!userId) return
    let mounted = true
    ;(async () => {
      try {
        const { visibleColumns } = await refreshColumnSettings<IUserLog>('logTable', userId, allColumns)
        if (mounted) setVisible(visibleColumns.length ? visibleColumns : allColumns)
      } catch (err) {
        console.error(err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [userId, allColumns])

  // Reset pageIndex when filters change
  useEffect(() => {
    setPageIndex(0)
  }, [filters, setPageIndex])

  // Fetch table data whenever filters, pagination, sorting, or globalFilter change
  useEffect(() => {
    const controller = new AbortController()
    fetchData().catch(err => {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error(err)
    })
    localStorage.setItem('logFilters', JSON.stringify(filters))
    return () => controller.abort()
  }, [fetchData]) // ✅ stable, depends only on stable fetchData

  const visibleIds = visible.map(col => col.id ?? ((col as any).accessorKey ?? ''))
  const isFilterActive = Object.entries(filters).some(([_, value]) =>
    Array.isArray(value) ? value.length > 0 : value !== ''
  )

  const table = useReactTable({
    data,
    columns: visible,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

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

        <div className="relative rounded-sm shadow overflow-hidden bg-white" id="printable-user-table">
          <div className="max-h-[600px] min-h-[200px] overflow-y-auto">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-opacity-70 mt-20">
                <TableLoader loading />
              </div>
            )}
            <table className="table-auto w-full text-left border border-collapse">
              <thead className="sticky -top-1 z-10 bg-gray-200">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className={`p-2 border ${header.column.columnDef.meta?.customClassName || ''}`}>
                        <div
                          className="flex justify-between items-center w-full cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
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
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-2 border">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <TablePaginationFooter
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={totalCount}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
        />
      </div>

      {showDetail && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title="Log Details">
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
        onApply={newFilters => {
          setFilters(newFilters)
          setFilterModalOpen(false)
        }}
        initialFilters={filters}
        renderForm={(filterValues, setFilterValues) => (
          <LogFilterForm filterValues={filterValues} setFilterValues={setFilterValues} onClose={() => setFilterModalOpen(false)} />
        )}
      />
    </motion.div>
  )
}
