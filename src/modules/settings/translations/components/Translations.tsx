// app/(dashboard)/admin/translations/Translations.tsx

import { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa'

import { useTable } from '@/hooks/useTable'
import { useDetailModal } from '@/hooks/useDetailModal'
import {
  TableLoader,
  TableHeaderActions,
  TablePaginationFooter,
  RowActions,
  IndexCell,
  TableWithLoader,
  SelectAllCheckbox
} from '@/components/custom/Table'
import Modal from '@/components/custom/Modal'
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager'
import { refreshColumnSettings } from '@/lib/refreshColumnSettings'
import { exportVisibleTableToExcel } from '@/lib/exportTable'
import { printTableById } from '@/lib/printTable'
import { getCustomDateTime } from '@/lib/formatDate'
import { FilterModal } from '@/components/custom/FilterModal'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'

import TranslationDetail from './TranslationDetail'
import type { ITranslation } from '@/types/translation'
import TranslationFilterForm from './TranslationFilterForm'
import { can } from '@/lib/authCheck'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import AddTranslation from './AddTranslation'
import EditTranslation from './EditTranslation'
import { useEditSheet } from '@/hooks/useEditSheet'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import { getTranslations, deleteTranslation, bulkDeleteTranslations } from '../api'
import { useRefreshTranslations } from '@/hooks/useRefreshTranslations'
import { dispatchShowToast } from '@/lib/dispatch'
import { cn } from '@/lib/utils'
import { AlertTriangle, Archive, Trash2 } from 'lucide-react'

// Helper function to validate ID
const isValidId = (id: string): boolean => {
  return Boolean(id && id.length > 0 && id !== '0')
}

/* ---------------------------------- */
/* Select Column with Frontend Sorting */
/* ---------------------------------- */
const getSelectColumn = (): ColumnDef<ITranslation> => ({
  id: 'select',
  accessorFn: (row) => row.id,
  header: ({ table }) => {
    const allRows = table.getCoreRowModel().rows
    const selectableRows = allRows.filter(row => row.getCanSelect())
    const isAllSelected = selectableRows.length > 0 && selectableRows.every(row => row.getIsSelected())
    const isSomeSelected = selectableRows.some(row => row.getIsSelected()) && !isAllSelected
    
    const handleSelectAll = () => {
      if (isAllSelected) {
        table.setRowSelection({})
      } else {
        const newSelection: Record<string, boolean> = {}
        selectableRows.forEach(row => {
          newSelection[row.id] = true
        })
        table.setRowSelection(newSelection)
      }
    }
    
    return (
      <div 
        className="flex justify-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          handleSelectAll()
        }}
      >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          isAllSelected 
            ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
            : isSomeSelected
              ? 'bg-blue-200 border-blue-400 dark:bg-blue-800 dark:border-blue-600'
              : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500'
        }`}>
          {isAllSelected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {!isAllSelected && isSomeSelected && (
            <div className="w-2 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </div>
      </div>
    )
  },
  cell: ({ row }) => {
    const isSelected = row.getIsSelected()
    
    return (
      <div className="flex justify-center">
        <div 
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleSelected(!isSelected)
          }}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
              : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      </div>
    )
  },
  enableSorting: true,
  sortingFn: (rowA, rowB) => {
    const isSelectedA = rowA.getIsSelected()
    const isSelectedB = rowB.getIsSelected()
    if (isSelectedA === isSelectedB) return 0
    return isSelectedA ? -1 : 1
  },
  sortDescFirst: false,
  meta: { customClassName: 'text-center', tdClassName: 'text-center' },
})

/* ---------------------------------- */
/* Columns Definition */
/* ---------------------------------- */
const getDataColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  handleEditClick,
  confirmDelete,
  showDetail = true,
  showEdit = true,
  showDelete = true,
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (item: ITranslation) => void
  handleEditClick: (item: ITranslation) => void
  confirmDelete: (id: string) => void  
  showDetail?: boolean
  showEdit?: boolean
  showDelete?: boolean
}): ColumnDef<ITranslation>[] => [
  {
    header: 'SL',
    id: 'sl',
    cell: ({ row }) => (
      <IndexCell rowIndex={row.index} pageIndex={pageIndex} pageSize={pageSize} />
    ),
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: false,
  },
  {
    header: 'Action',
    id: 'action',
    cell: ({ row }) => {
        return (
        <RowActions
            row={row.original}
            onDetail={() => fetchDetail(row.original)}
            onEdit={() => handleEditClick(row.original)}
            onDelete={() => confirmDelete(row.original.id)}
            showDetail={showDetail}
            showEdit={showEdit}
            showDelete={showDelete}
        />
        )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: false,
  },
  {
    header: 'Key',
    accessorKey: 'key',
    cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>,
    enableSorting: true,
  },
  {
    header: 'Module',
    accessorKey: 'module',
    cell: ({ getValue }) => {
      const module = getValue() as string;
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {module}
        </span>
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: true,
  },
  {
    header: 'English Value',
    accessorKey: 'englishValue',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <span className="max-w-[300px] truncate block" title={value}>{value}</span>
    },
    enableSorting: true,
  },
  {
    header: 'Bangla Value',
    accessorKey: 'banglaValue',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <span className="max-w-[300px] truncate block" title={value}>{value}</span>
    },
    enableSorting: true,
  },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-',
    enableSorting: true,
  },
  {
    header: 'Updated At',
    accessorKey: 'updatedAt',
    cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-',
    enableSorting: true,
  },
  {
    header: 'Created By',
    accessorKey: 'createdByName',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return value || '-';
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: true,
  },
  {
    header: 'Updated By',
    accessorKey: 'updatedByName',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return value || '-';
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: true,
  },
]

/* ---------------------------------- */
/* Translations Component */
/* ---------------------------------- */
export default function Translations() {
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '')
  const { refreshTranslations } = useRefreshTranslations()

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading
  } = useDetailModal<ITranslation>('/translations')

  const [visible, setVisible] = useState<ColumnDef<ITranslation>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [showAddButton, setShowAddButton] = useState(false)

  // Selection state for bulk operations
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
  
  // Bulk delete state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  const showDetail = true
  const showEdit = can(['update-admin-translations'])
  const showDelete = can(['delete-admin-translations'])

  const {
    isOpen: isEditSheetOpen,
    itemToEdit: translationToEdit,
    openEdit: handleEditClick,
    closeEdit: closeEditSheet
  } = useEditSheet<ITranslation>()

  const hasFetchedRef = useRef(false)
  const prevFiltersRef = useRef<Record<string, any>>({})

  /* ---------------- Stable Fetcher ---------------- */
  const stableFetcher = useCallback(
    async ({
      q = '',
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    }: {
      q?: string
      page: number
      limit: number
      sortBy?: string
      sortOrder?: string
    }): Promise<{
      data: ITranslation[]
      total: number
      grandTotalCount: number
    }> => {
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if ((key === 'startDate' || key === 'endDate') && (value === '' || value === null)) {
          acc[key] = null
        }
        else if (Array.isArray(value) && value.length === 0) {
          // Skip
        }
        else {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>)

      const res = await getTranslations({
        q,
        page,
        limit,
        sortBy,
        sortOrder,
        ...cleanFilters
      })

      return {
        data: res.translations as ITranslation[],
        total: res.totalCount,
        grandTotalCount: res.grandTotalCount
      }
    },
    [filters]
  )


  /* ---------------- Table Hook ---------------- */
  const {
    data,
    totalCount,
    grandTotalCount,
    loading,
    error,
    sorting,
    setSorting,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    fetchData,
    globalFilter,
    setGlobalFilter,
  } = useTable<ITranslation>({
    fetcher: stableFetcher,
    defaultSort: 'createdAt',
    enableTrashView: false,
    minLoadingTime: 500
  })

  /* ---------------- Delete Handler ---------------- */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const confirmDelete = useCallback((id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }, [])

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false)
    setDeleteId(null)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    
    setDeleteLoading(true)
    try {
      await deleteTranslation(Number(deleteId))
      await refreshTranslations()
      dispatchShowToast({ type: "success", message: "Translation deleted successfully" })
      setDeleteDialogOpen(false)
      setDeleteId(null)
      fetchData()
      setSelectedRowIds({})
    } catch (error: any) {
      console.error('Delete failed:', error)
      dispatchShowToast({ type: "danger", message: error.response?.data?.message || "Failed to delete translation" })
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteId, fetchData, refreshTranslations])

  /* ---------------- Bulk Operations ---------------- */
  const getSelectedIds = useCallback(() => {
    return Object.keys(selectedRowIds).filter(id => selectedRowIds[id] && isValidId(id))
  }, [selectedRowIds])

  const handleBulkDelete = useCallback(() => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) {
      dispatchShowToast({ type: "warning", message: "No translations selected for deletion" })
      return
    }
    setBulkDeleteDialogOpen(true)
  }, [getSelectedIds])

  const executeBulkDelete = useCallback(async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return
    
    setBulkLoading(true)
    try {
      await bulkDeleteTranslations(selectedIds)
      await refreshTranslations()
      dispatchShowToast({ type: "success", message: `${selectedIds.length} translation(s) deleted successfully` })
      setBulkDeleteDialogOpen(false)
      setSelectedRowIds({})
      fetchData()
    } catch (error: any) {
      console.error('Bulk delete failed:', error)
      dispatchShowToast({ type: "danger", message: error.response?.data?.message || "Failed to delete translations" })
    } finally {
      setBulkLoading(false)
    }
  }, [getSelectedIds, fetchData, refreshTranslations])

  /* ---------------- Stable Columns ---------------- */
  const selectColumn = useMemo(() => getSelectColumn(), [])
  const dataColumns = useMemo(() => getDataColumns({
    pageIndex,
    pageSize,
    fetchDetail,
    handleEditClick,
    confirmDelete,
    showDetail,
    showEdit,
    showDelete
  }), [pageIndex, pageSize, fetchDetail, handleEditClick, confirmDelete, showDetail, showEdit, showDelete])

  const allColumns = useMemo(() => [selectColumn, ...dataColumns], [selectColumn, dataColumns])
  const allColumnsRef = useRef(allColumns)
  allColumnsRef.current = allColumns

  /* ---------------- Add Button Permission ---------------- */
  useEffect(() => {
    setShowAddButton(can(['create-admin-translations']))
  }, [])

  /* ---------------- Load Column Settings ---------------- */
  useEffect(() => {
    if (!userId) return

    let mounted = true

    const loadColumnSettings = async () => {
      try {
        const { visibleColumns } = await refreshColumnSettings<ITranslation>(
          'translationTable',
          userId,
          allColumnsRef.current
        )

        if (mounted) {
          setVisible(visibleColumns.length ? visibleColumns : allColumnsRef.current)
        }
      } catch (err) {
        console.error(err)
      }
    }

    loadColumnSettings()

    return () => {
      mounted = false
    }
  }, [userId])

  /* ---------------- Initial Fetch ---------------- */
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchData()
      hasFetchedRef.current = true
    }
  }, [fetchData])

  /* ---------------- Filters Fetch ---------------- */
  useEffect(() => {
    if (!hasFetchedRef.current) return
    
    if (JSON.stringify(prevFiltersRef.current) === JSON.stringify(filters)) {
      return
    }
    setPageIndex(0)
    fetchData()
    prevFiltersRef.current = filters
    
  }, [filters, fetchData, setPageIndex])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
  setPageSize(newPageSize)
  // Reset to first page when changing page size
  if (pageIndex !== 0) {
    setPageIndex(0)
  }
}, [setPageSize, setPageIndex, pageIndex])

  /* ---------------- Visible Column IDs ---------------- */
  const visibleIds = useMemo(
    () => visible.map(c => c.id ?? ((c as any).accessorKey ?? '')),
    [visible]
  )

  const isFilterActive = useMemo(
    () =>
      Object.values(filters).some(
        v => v && (Array.isArray(v) ? v.length > 0 : true)
      ),
    [filters]
  )

  /* ---------------- Table Instance ---------------- */
  const table = useReactTable<ITranslation>({
    data,
    columns: visible,
    getRowId: (row) => row.id.toString(),
    enableSorting: true,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize
      },
      rowSelection: selectedRowIds,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      let newSelection: Record<string, boolean>
      
      if (typeof updater === 'function') {
        newSelection = updater(selectedRowIds)
      } else {
        newSelection = updater
      }
      
      const filteredSelection = Object.keys(newSelection).reduce((acc, key) => {
        if (isValidId(key) && newSelection[key]) {
          acc[key] = newSelection[key]
        }
        return acc
      }, {} as Record<string, boolean>)
      
      setSelectedRowIds(filteredSelection)
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      
      // Only fetch data if sorting by columns other than 'select'
      const isSelectColumnSort = newSorting.length > 0 && newSorting[0].id === 'select'
      if (!isSelectColumnSort) {
        fetchData()
      }
    },
    manualPagination: true,
    manualSorting: false,
    pageCount: Math.ceil(totalCount / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const handleResetSorting = useCallback(() => {
    setSorting([])
  }, [setSorting])

  /* ---------------- Empty State ---------------- */
  const showEmptyState = !loading && !error && data.length === 0
  const showErrorState = !loading && error

  /* ---------------- UI ---------------- */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <TableHeaderActions
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onAddNew={() => setIsSheetOpen(true)}
        showAddButton={showAddButton}
        showTrashButton={false}
        showBulkActions={true}
        selectedCount={Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length}
        onBulkDelete={handleBulkDelete}
        onBulkRestore={undefined}
        onBulkPermanentDelete={undefined}
        // Add a dummy trashButton to make the bulk delete button appear
        trashButton={{
          onClick: () => {},
          label: 'Trash',
          show: true
        }}
        showResetSorting={sorting.length > 0 && sorting[0]?.id === 'select'}
        onResetSorting={handleResetSorting}
        onColumnSettings={() => setShowColumnModal(true)}
        onPrint={() => printTableById('printable-translation-table', 'Translations')}
        onExport={() =>
          exportVisibleTableToExcel({
            data,
            columns: allColumns,
            visibleColumnIds: visibleIds,
            fileName: 'Translations'
          })
        }
        onFilter={() => setFilterModalOpen(true)}
        isFilterActive={isFilterActive}
      />
      
      {/* TABLE */}
      <TableWithLoader loading={loading} id="printable-translation-table">
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <svg
              className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No translations found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Try adjusting your search or filter criteria to see more results.
            </p>
          </div>
        ) : (
          <table className="table-auto w-full text-left border border-collapse">
            <thead className="sticky -top-1 z-10 bg-gray-200 dark:bg-gray-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort()
                    
                    return (
                      <th
                        key={header.id}
                        className={`p-2 border text-center ${header.column.columnDef.meta?.customClassName || ''}`}
                        onClick={(event) => {
                          if (isSortable) {
                            const handler = header.column.getToggleSortingHandler()
                            if (handler) handler(event)
                          }
                        }}
                        style={{ cursor: isSortable ? 'pointer' : 'default' }}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="flex-1 text-center">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {isSortable && (
                            <span className="ml-2 relative">
                              {header.column.getIsSorted() === 'asc' ? (
                                <FaSortUp size={12} />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <FaSortDown size={12} />
                              ) : (
                                <FaSort size={12} />
                              )}
                              {header.column.id === 'select' && header.column.getIsSorted() && (
                                <span className="absolute -top-1 -right-2 text-xs text-blue-500" title="Frontend sorting (no API call)">
                                  ⚡
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={cn(
                  "border-b dark:border-gray-700 transition-colors",
                  row.getIsSelected() && "bg-blue-200 dark:bg-blue-950/70"
                )}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`p-2 border ${cell.column.columnDef.meta?.tdClassName || ''}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWithLoader>

      {/* PAGINATION */}
      {!showEmptyState && !showErrorState && totalCount > 0 && (
        <TablePaginationFooter
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={totalCount}
          grandTotalCount={grandTotalCount}
          setPageIndex={setPageIndex}
          setPageSize={handlePageSizeChange}
        />
      )}

      {/* TRANSLATION DETAIL */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Translation Details"
        widthPercent={60}
      >
        {detailLoading || !selectedItem ? (
          <TableLoader loading />
        ) : (
          <TranslationDetail translation={selectedItem} onUpdated={fetchData} />
        )}
      </Modal>

      {/* COLUMN MANAGER */}
      {showColumnModal && (
        <ColumnVisibilityManager<ITranslation>
          tableId="translationTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      {/* FILTER MODAL */}
      <FilterModal
        tableId="translationTable"
        title="Filter Translations"
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={newFilters => {
          const cleanedFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
            if ((key === 'startDate' || key === 'endDate') && (value === '' || value === null)) {
              acc[key] = null
            } else {
              acc[key] = value
            }
            return acc
          }, {} as Record<string, any>)
          
          setPageIndex(0)
          setFilters(cleanedFilters)
          setFilterModalOpen(false)
        }}
        initialFilters={filters}
        renderForm={(filterValues, setFilterValues, resetRef) => (
          <TranslationFilterForm
            filterValues={filterValues}
            setFilterValues={setFilterValues}
            onResetRef={resetRef}
            onClose={() => setFilterModalOpen(false)}
          />
        )}
      />

      {/* ADD TRANSLATION */}
      {showAddButton && (
        <FormHolderSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          title="Add New Translation"
          titleDivClassName="success-gradient"
        >
          <AddTranslation fetchData={fetchData} onClose={() => setIsSheetOpen(false)} />
        </FormHolderSheet>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDelete && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onCancel={cancelDelete}
          onConfirm={handleDelete}
          title="Confirm Deletion"
          description="Are you sure you want to delete this translation? This will also delete all associated translation values."
          confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
          loading={deleteLoading}
        />
      )}

      {/* BULK DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onCancel={() => setBulkDeleteDialogOpen(false)}
        onConfirm={executeBulkDelete}
        title="Bulk Delete Translations"
        variant="destructive"
        icon={<Trash2 className="w-6 h-6" />}
        confirmLabel={bulkLoading ? 'Deleting...' : 'Delete'}
        loading={bulkLoading}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
              Warning: This action cannot be undone!
            </p>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected translation(s)?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will permanently delete all selected translations and their associated values.
          </p>
        </div>
      </ConfirmDialog>

      {/* EDIT TRANSLATION */}
      {showEdit && (
        <FormHolderSheet
          open={isEditSheetOpen}
          onOpenChange={closeEditSheet}
          title="Edit Translation"
          titleDivClassName="warning-gradient"
        >
          {translationToEdit && (
            <EditTranslation
              translationId={translationToEdit.id}
              onClose={closeEditSheet}
              fetchData={fetchData}
            />
          )}
        </FormHolderSheet>
      )}
    </motion.div>
  )
}