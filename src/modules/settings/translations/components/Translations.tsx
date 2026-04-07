import { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
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
  EmptyState,
  TableWithLoader
} from '@/components/custom/Table'
import Modal from '@/components/custom/Modal'
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager'
import { refreshColumnSettings } from '@/lib/refreshColumnSettings'
import { exportVisibleTableToExcel } from '@/lib/exportTable'
import { printTableById } from '@/lib/printTable'
import { getCustomDateTime } from '@/lib/formatDate'
import { FilterModal } from '@/components/custom/FilterModal'
import { useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/redux/store'

import TranslationDetail from './TranslationDetail'
import type { ITranslation } from '@/types/translation'
import TranslationFilterForm from './TranslationFilterForm'
import { can } from '@/lib/authCheck'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import AddTranslation from './AddTranslation'
import EditTranslation from './EditTranslation'
import { useEditSheet } from '@/hooks/useEditSheet'
import { useDeleteWithConfirm } from '@/hooks/useDeleteWithConfirm'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import { getTranslations, deleteTranslation } from '../api'
import { useTranslations } from '@/hooks/useTranslations'
import { useAppDispatch } from '@/hooks/useRedux'
import { fetchTranslations } from '@/redux/slices/languageSlice'
import { useRefreshTranslations } from '@/hooks/useRefreshTranslations'

/* ---------------------------------- */
/* Columns Definition */
/* ---------------------------------- */
const getAllColumns = ({
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
            onDelete={() => confirmDelete(row.original.id)}  // row.original.id is string, which matches confirmDelete
            showDetail={showDetail}
            showEdit={showEdit}
            showDelete={showDelete}
        />
        )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    },
//   {
//     header: 'ID',
//     accessorKey: 'id',
//     meta: { customClassName: 'text-center', tdClassName: 'text-center' },
//   },
  {
    header: 'Key',
    accessorKey: 'key',
    cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>
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
    meta: { customClassName: 'text-center', tdClassName: 'text-center' }
  },
  {
    header: 'English Value',
    accessorKey: 'englishValue',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <span className="max-w-[300px] truncate block" title={value}>{value}</span>
    }
  },
  {
    header: 'Bangla Value',
    accessorKey: 'banglaValue',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <span className="max-w-[300px] truncate block" title={value}>{value}</span>
    }
  },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-'
  },
  {
    header: 'Updated At',
    accessorKey: 'updatedAt',
    cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-'
  },
  {
  header: 'Created By',
  accessorKey: 'createdByName',
  cell: ({ getValue }) => {
    const value = getValue() as string;
    return value || '-';
  },
  meta: { customClassName: 'text-center', tdClassName: 'text-center' }
},
{
  header: 'Updated By',
  accessorKey: 'updatedByName',
  cell: ({ getValue }) => {
    const value = getValue() as string;
    return value || '-';
  },
  meta: { customClassName: 'text-center', tdClassName: 'text-center' }
},
]

/* ---------------------------------- */
/* Translations Component */
/* ---------------------------------- */
export default function Translations() {
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '')

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading
  } = useDetailModal<ITranslation>('/translations')
  const { refreshTranslations } = useRefreshTranslations()


  const [visible, setVisible] = useState<ColumnDef<ITranslation>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [showAddButton, setShowAddButton] = useState(false)

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

/* ---------------- Delete Hook ---------------- */
const { t } = useTranslations()
const {
  dialogOpen,
  confirmDelete,
  cancelDelete,
  handleDelete,
  deleteLoading
} = useDeleteWithConfirm({
  deleteFunction: async (id: string) => {
    const result = await deleteTranslation(Number(id))
    // After successful delete, refresh the frontend translations cache
    await refreshTranslations()
    return result
  },
  onSuccess: fetchData,
  successMessage: t('Translation deleted successfully'),
  errorMessage: t('Failed to delete translation'),
  inactiveMessage: t('Translation cannot be deleted')
})

  /* ---------------- Stable Columns ---------------- */
  const allColumnsRef = useRef<ColumnDef<ITranslation>[]>([])

  if (!allColumnsRef.current.length) {
    allColumnsRef.current = getAllColumns({
      pageIndex,
      pageSize,
      fetchDetail,
      handleEditClick,
      confirmDelete,
      showDetail,
      showEdit,
      showDelete
    })
  }

  const allColumns = allColumnsRef.current

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
          allColumns
        )

        if (mounted) {
          setVisible(visibleColumns.length ? visibleColumns : allColumns)
        }
      } catch (err) {
        console.error(err)
      }
    }

    loadColumnSettings()

    return () => {
      mounted = false
    }
  }, [userId, allColumns])

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
  const table = useReactTable({
    data,
    columns: visible,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize
      }
    },
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

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
        <table className="table-auto w-full text-left border border-collapse">
          <thead className="sticky -top-1 z-10 bg-gray-200 dark:bg-gray-700">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`p-2 border text-center ${header.column.columnDef.meta?.customClassName || ''}`}
                  >
                    <div
                      className="flex justify-between items-center w-full cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="flex-1 text-center">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
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
            transition={{
              duration: 0.5,
              ease: 'easeOut'
            }}
          >
            {/* Error State Row */}
            {showErrorState && (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className="p-0">
                  <EmptyState
                    message="Error loading translations"
                    suggestion="Please try again or contact support"
                  />
                </td>
              </tr>
            )}

            {/* Empty State Row */}
            {!showErrorState && showEmptyState && (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className="p-0">
                  <EmptyState
                    message="No translations found"
                    suggestion="Try adjusting your filters or add a new translation"
                  />
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!showErrorState && !showEmptyState && (
              <>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b dark:border-gray-700">
                    {row.getVisibleCells().map(cell => (
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
              </>
            )}
          </motion.tbody>
        </table>
      </TableWithLoader>

      {/* PAGINATION */}
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

      {/* DELETE CONFIRMATION */}
      {showDelete && (
        <ConfirmDialog
          open={dialogOpen}
          onCancel={cancelDelete}
          onConfirm={handleDelete}
          title="Confirm Deletion"
          description="Are you sure you want to delete this translation? This will also delete all associated translation values."
          confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
          loading={deleteLoading}
        />
      )}

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