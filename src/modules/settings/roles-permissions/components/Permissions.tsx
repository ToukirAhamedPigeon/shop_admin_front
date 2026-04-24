// app/(dashboard)/admin/permissions/Permissions.tsx

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
  TrashViewIndicator,
  TableWithLoader
} from '@/components/custom/Table'
import Modal from '@/components/custom/Modal'
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager'
import { refreshColumnSettings } from '@/lib/refreshColumnSettings'
import { exportVisibleTableToExcel } from '@/lib/exportTable'
import { printTableById } from '@/lib/printTable'
import { getCustomDateTime } from '@/lib/formatDate'
import { ExpandableText } from '@/components/custom/ExpandableText'
import { FilterModal } from '@/components/custom/FilterModal'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'

import PermissionDetail from './PermissionDetail'
import type { IPermission } from '@/types/role-permission'
import PermissionFilterForm from './PermissionFilterForm'
import { can } from '@/lib/authCheck'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import AddPermission from './AddPermission'
import EditPermission from './EditPermission'
import { useEditSheet } from '@/hooks/useEditSheet'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import { deletePermission, restorePermission, getPermissionDeleteInfo, getPermissions } from '../api'
import { AlertTriangle, Archive, FileWarning, Info, RotateCcw, Trash2, Database, XCircle } from 'lucide-react'
import { dispatchShowToast } from '@/lib/dispatch'

interface DeleteInfoResponse {
  canBePermanent: boolean
  message: string
  hasRelatedRecords?: boolean
}

/* ---------------------------------- */
/* Columns Definition */
/* ---------------------------------- */
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  handleEditClick,
  confirmSoftDelete,
  confirmRestore,
  confirmPermanentDelete,
  showDetail = true,
  showEdit = true,
  showSoftDelete = true,
  showRestore = true,
  showPermanentDelete = true
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (item: IPermission) => void
  handleEditClick: (item: IPermission) => void
  confirmSoftDelete: (id: string) => void
  confirmRestore: (id: string) => void
  confirmPermanentDelete: (id: string) => void
  showDetail?: boolean
  showEdit?: boolean
  showSoftDelete?: boolean
  showRestore?: boolean
  showPermanentDelete?: boolean
}): ColumnDef<IPermission>[] => [
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
      const isDeleted = row.original.isDeleted;
      
      return (
        <RowActions
          row={row.original}
          onDetail={() => fetchDetail(row.original)}
          onEdit={!isDeleted ? () => handleEditClick(row.original) : undefined}
          onDelete={!isDeleted && showSoftDelete ? () => confirmSoftDelete(row.original.id) : undefined}
          onRestore={isDeleted && showRestore ? () => confirmRestore(row.original.id) : undefined}
          onPermanentDelete={isDeleted && showPermanentDelete ? () => confirmPermanentDelete(row.original.id) : undefined}
          showDetail={showDetail}
          showEdit={showEdit && !isDeleted}
          showDelete={showSoftDelete && !isDeleted}
          showRestore={showRestore && isDeleted}
          showPermanentDelete={showPermanentDelete && isDeleted}
          deletePermissions={['delete-admin-permissions']}
          restorePermissions={['restore-admin-permissions']}
          permanentDeletePermissions={['delete-admin-permissions']}
        />
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>
  },
  {
    header: 'Guard Name',
    accessorKey: 'guardName',
  },
  {
    header: 'Roles',
    accessorKey: 'roles',
    cell: ({ getValue }) => {
      const roles = getValue() as string[] | undefined;
      return roles?.length ? (
        <ExpandableText text={roles.join(', ')} wordLimit={5} className="max-w-[300px] whitespace-pre-wrap break-all" />
      ) : <span className="text-gray-400">-</span>
    },
    meta: { customClassName: 'text-left min-w-[300px]' }
  },
  {
    header: 'Active',
    accessorKey: 'isActive',
    cell: ({ getValue }) => getValue() ? 'Yes' : <span className="text-red-500">No</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' }
  },
  {
    header: 'Deleted',
    accessorKey: 'isDeleted',
    cell: ({ getValue }) => getValue() ? <span className="text-red-500 font-semibold">Yes</span> : 'No',
    meta: { customClassName: 'text-center', tdClassName: 'text-center' }
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
]

/* ---------------------------------- */
/* Permissions Component */
/* ---------------------------------- */
export default function Permissions() {
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '')

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading
  } = useDetailModal<IPermission>('/permissions')

  const [visible, setVisible] = useState<ColumnDef<IPermission>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [showAddButton, setShowAddButton] = useState(false)
  const [showTrashButton, setShowTrashButton] = useState(false)

  // Delete dialogs state
  const [softDeleteDialogOpen, setSoftDeleteDialogOpen] = useState(false)
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteInfo, setDeleteInfo] = useState<DeleteInfoResponse | null>(null)
  const [checkingDelete, setCheckingDelete] = useState(false)

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDetails, setErrorDetails] = useState<{ 
    message: string; 
    blockingTables?: string[] 
  } | null>(null)

  // Restore dialog state
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [restoreId, setRestoreId] = useState<string | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)

  const showDetail = true
  const showEdit = can(['update-admin-permissions'])
  const showSoftDelete = can(['delete-admin-permissions'])
  const showRestore = can(['restore-admin-permissions'])
  const showPermanentDelete = can(['delete-admin-permissions'])

  const {
    isOpen: isEditSheetOpen,
    itemToEdit: permissionToEdit,
    openEdit: handleEditClick,
    closeEdit: closeEditSheet
  } = useEditSheet<IPermission>()

  const hasFetchedRef = useRef(false)
  const prevFiltersRef = useRef<Record<string, any>>({})

  /* ---------------- Stable Fetcher ---------------- */
  const stableFetcher = useCallback(
    async ({
      q = '',
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      showTrash = false
    }: {
      q?: string
      page: number
      limit: number
      sortBy?: string
      sortOrder?: string
      showTrash?: boolean
    }): Promise<{
      data: IPermission[]
      total: number
      grandTotalCount: number
    }> => {
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if ((key === 'from' || key === 'to') && value === '') {
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

      const finalFilters = {
        ...cleanFilters,
        isDeletedStr: showTrash ? 'true' : 'false'
      }

      const res = await getPermissions({
        q,
        page,
        limit,
        sortBy,
        sortOrder,
        ...finalFilters
      })

      return {
        data: res.permissions as IPermission[],
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
    showTrash,
    handleTrashClick,
    handleStoreClick,
    viewIndicator
  } = useTable<IPermission>({
    fetcher: stableFetcher,
    defaultSort: 'createdAt',
    enableTrashView: true,
    minLoadingTime: 1000
  })

  /* ---------------- Delete Eligibility Check ---------------- */
  const checkDeleteEligibility = useCallback(async (id: string): Promise<boolean> => {
    setCheckingDelete(true)
    try {
      const info = await getPermissionDeleteInfo(id)
      setDeleteInfo(info)
      return info.canBePermanent
    } catch (error) {
      console.error('Failed to get delete info:', error)
      setDeleteInfo({
        canBePermanent: false,
        message: 'Failed to check delete eligibility'
      })
      return false
    } finally {
      setCheckingDelete(false)
    }
  }, [])

  const confirmSoftDelete = useCallback(async (id: string) => {
    setDeleteId(id)
    setSoftDeleteDialogOpen(true)
  }, [])

  const confirmRestore = useCallback((id: string) => {
    setRestoreId(id)
    setRestoreDialogOpen(true)
  }, [])

  const confirmPermanentDelete = useCallback(async (id: string) => {
    setDeleteId(id)
    await checkDeleteEligibility(id)
    setPermanentDeleteDialogOpen(true)
  }, [checkDeleteEligibility])

  const handleSoftDelete = useCallback(async () => {
    if (!deleteId) return
    
    setDeleteLoading(true)
    try {
      const response = await deletePermission(deleteId, false)
      
      if (response.status === 200) {
        dispatchShowToast({ 
          type: "success", 
          message: response.data?.message || "Permission moved to trash successfully" 
        })
        setSoftDeleteDialogOpen(false)
        setDeleteId(null)
        fetchData()
      } else {
        throw new Error(response.data?.message || "Failed to move permission to trash")
      }
    } catch (error: any) {
      console.error('Soft delete failed:', error)
      let errorMessage = error.response?.data?.message || error.message || "Failed to move permission to trash"
      dispatchShowToast({ type: "danger", message: errorMessage })
      setSoftDeleteDialogOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteId, fetchData])

  const handlePermanentDelete = useCallback(async () => {
    if (!deleteId) return
    
    setDeleteLoading(true)
    try {
      const response = await deletePermission(deleteId, true)
      
      if (response.status === 200 && response.data) {
        dispatchShowToast({ 
          type: "success", 
          message: response.data.message || "Permission permanently deleted successfully" 
        })
        setPermanentDeleteDialogOpen(false)
        setSoftDeleteDialogOpen(false)
        setDeleteId(null)
        fetchData()
      } else {
        throw new Error(response.data?.message || "Failed to delete permission")
      }
    } catch (error: any) {
      console.error('Permanent delete failed:', error)
      
      let errorMessage = error.response?.data?.message || error.message || "Failed to permanently delete permission"
      
      setErrorDetails({
        message: errorMessage,
        blockingTables: error.response?.data?.blockingTables
      })
      setErrorDialogOpen(true)
      setPermanentDeleteDialogOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteId, fetchData])

  const cancelDelete = useCallback(() => {
    setSoftDeleteDialogOpen(false)
    setPermanentDeleteDialogOpen(false)
    setDeleteId(null)
    setDeleteInfo(null)
    setErrorDetails(null)
  }, [])

  const cancelRestore = useCallback(() => {
    setRestoreDialogOpen(false)
    setRestoreId(null)
  }, [])

  const handleRestore = useCallback(async () => {
    if (!restoreId) return
    
    setRestoreLoading(true)
    try {
      await restorePermission(restoreId)
      dispatchShowToast({ type: "success", message: "Permission restored successfully" })
      setRestoreDialogOpen(false)
      setRestoreId(null)
      fetchData()
    } catch (error: any) {
      console.error('Failed to restore permission:', error)
      let errorMessage = error.response?.data?.message || "Failed to restore permission"
      dispatchShowToast({ type: "danger", message: errorMessage })
    } finally {
      setRestoreLoading(false)
    }
  }, [restoreId, fetchData])

  /* ---------------- Stable Columns ---------------- */
  const allColumnsRef = useRef<ColumnDef<IPermission>[]>([])

  if (!allColumnsRef.current.length) {
    allColumnsRef.current = getAllColumns({
      pageIndex,
      pageSize,
      fetchDetail,
      handleEditClick,
      confirmSoftDelete,
      confirmRestore,
      confirmPermanentDelete,
      showDetail,
      showEdit,
      showSoftDelete,
      showRestore,
      showPermanentDelete
    })
  }

  const allColumns = allColumnsRef.current

  /* ---------------- Add Button Permission ---------------- */
  useEffect(() => {
    setShowAddButton(can(['create-admin-permissions']))
    setShowTrashButton(can(['restore-admin-permissions']))
  }, [])

  /* ---------------- Load Column Settings ---------------- */
  useEffect(() => {
    if (!userId) return

    let mounted = true

    const loadColumnSettings = async () => {
      try {
        const { visibleColumns } = await refreshColumnSettings<IPermission>(
          'permissionTable',
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
    
  }, [filters, fetchData])

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

  const showEmptyState = !loading && !error && data.length === 0
  const showErrorState = !loading && error

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-start mb-2">
        {viewIndicator && <TrashViewIndicator type={viewIndicator.type} />}
      </div>
      <TableHeaderActions
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onAddNew={() => setIsSheetOpen(true)}
        showAddButton={showAddButton}
        showTrashButton={showTrashButton}
        trashButton={
          !showTrash ? {
            onClick: handleTrashClick,
            label: 'Trash',
            show: true
          } : undefined
        }
        storeButton={
          showTrash ? {
            onClick: handleStoreClick,
            label: 'Store',
            show: true
          } : undefined
        }
        onColumnSettings={() => setShowColumnModal(true)}
        onPrint={() => printTableById('printable-permission-table', 'Permissions')}
        onExport={() =>
          exportVisibleTableToExcel({
            data,
            columns: allColumns,
            visibleColumnIds: visibleIds,
            fileName: 'Permissions'
          })
        }
        onFilter={() => setFilterModalOpen(true)}
        isFilterActive={isFilterActive}
      />
      
      <TableWithLoader loading={loading} id="printable-permission-table">
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

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b dark:border-gray-700">
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
      </TableWithLoader>

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

      {/* Permission Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Permission Details"
        widthPercent={60}
      >
        {detailLoading || !selectedItem ? (
          <TableLoader loading />
        ) : (
          <PermissionDetail permission={selectedItem} onUpdated={fetchData} />
        )}
      </Modal>

      {/* Column Manager */}
      {showColumnModal && (
        <ColumnVisibilityManager<IPermission>
          tableId="permissionTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        tableId="permissionTable"
        title="Filter Permissions"
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={newFilters => {
          const cleanedFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
            if ((key === 'from' || key === 'to') && value === '') {
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
          <PermissionFilterForm
            filterValues={filterValues}
            setFilterValues={setFilterValues}
            onResetRef={resetRef}
            onClose={() => setFilterModalOpen(false)}
            showTrash={showTrash}
            onShowTrashChange={(newShowTrash) => {
              if (newShowTrash && !showTrash) {
                handleTrashClick();
              } else if (!newShowTrash && showTrash) {
                handleStoreClick();
              }
            }}
          />
        )}
      />

      {/* Add Permission Sheet */}
      {showAddButton && (
        <FormHolderSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          title="Add New Permission"
          titleDivClassName="success-gradient"
        >
          <AddPermission fetchData={fetchData} onClose={() => setIsSheetOpen(false)} />
        </FormHolderSheet>
      )}

      {/* Soft Delete Confirmation Dialog */}
      <ConfirmDialog
        open={softDeleteDialogOpen}
        onCancel={cancelDelete}
        onConfirm={handleSoftDelete}
        title="Move to Trash"
        variant="warning"
        icon={<Archive className="w-6 h-6" />}
        confirmLabel={deleteLoading ? 'Moving to Trash...' : 'Move to Trash'}
        loading={deleteLoading}
      >
        <div className="space-y-3">
          <p className="text-yellow-600 dark:text-yellow-400 font-medium">
            This permission will be moved to trash. You can restore it later.
          </p>
          {deleteInfo?.message && deleteInfo.canBePermanent === false && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{deleteInfo.message}</p>
            </div>
          )}
        </div>
      </ConfirmDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        open={permanentDeleteDialogOpen}
        onCancel={cancelDelete}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Permission"
        variant="destructive"
        icon={<FileWarning className="w-6 h-6" />}
        confirmLabel={deleteLoading ? 'Permanently Deleting...' : 'Yes, Permanently Delete'}
        loading={deleteLoading}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
              Warning: This action cannot be undone!
            </p>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300">
            This will permanently delete the permission and all associated data including:
          </p>
          
          <ul className="space-y-2 ml-4">
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Role-permission assignments
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              User-permission assignments
            </li>
          </ul>

          {deleteInfo?.message && deleteInfo.canBePermanent === false && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{deleteInfo.message}</p>
            </div>
          )}
        </div>
      </ConfirmDialog>

      {/* Restore Confirmation Dialog */}
      {showRestore && (
        <ConfirmDialog
          open={restoreDialogOpen}
          onCancel={cancelRestore}
          onConfirm={handleRestore}
          title="Restore Permission"
          variant="success"
          icon={<RotateCcw className="w-6 h-6" />}
          confirmLabel={restoreLoading ? 'Restoring...' : 'Restore'}
          loading={restoreLoading}
        >
          <div className="space-y-3">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Are you sure you want to restore this permission?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The permission will be moved back to active permissions with all its role assignments.
            </p>
          </div>
        </ConfirmDialog>
      )}

      {/* Error Dialog */}
      <ConfirmDialog
        open={errorDialogOpen}
        onCancel={() => setErrorDialogOpen(false)}
        onConfirm={() => setErrorDialogOpen(false)}
        title="Cannot Delete Permission"
        variant="destructive"
        icon={<XCircle className="w-6 h-6" />}
        confirmLabel="OK"
        showCancelButton={false}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <Database className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">
              {errorDetails?.message || "This permission has existing related records"}
            </p>
          </div>
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please move this permission to trash instead, or manually remove the related records first.
            </p>
          </div>
        </div>
      </ConfirmDialog>

      {/* Edit Permission Sheet */}
      {showEdit && (
        <FormHolderSheet
          open={isEditSheetOpen}
          onOpenChange={closeEditSheet}
          title="Edit Permission"
          titleDivClassName="warning-gradient"
        >
          {permissionToEdit && (
            <EditPermission
              permissionId={permissionToEdit.id}
              onClose={closeEditSheet}
              fetchData={fetchData}
            />
          )}
        </FormHolderSheet>
      )}
    </motion.div>
  )
}