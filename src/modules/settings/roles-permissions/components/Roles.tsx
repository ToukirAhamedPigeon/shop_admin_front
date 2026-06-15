// app/(dashboard)/admin/roles/Roles.tsx
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
  TableWithLoader,
  SelectAllCheckbox
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

import RoleDetail from './RoleDetail'
import type { IRole } from '@/types/role-permission'
import RoleFilterForm from './RoleFilterForm'
import { can } from '@/lib/authCheck'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import AddRole from './AddRole'
import EditRole from './EditRole'
import { useEditSheet } from '@/hooks/useEditSheet'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import { deleteRole, restoreRole, getRoleDeleteInfo, getRoles, bulkDeleteRoles, bulkRestoreRoles } from '../api'
import { AlertTriangle, Archive, FileWarning, RotateCcw, Database, XCircle } from 'lucide-react'
import { dispatchShowToast } from '@/lib/dispatch'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/hooks/useRedux'

interface DeleteInfoResponse {
  canBePermanent: boolean
  message: string
  hasRelatedRecords?: boolean
}

// Helper function to validate ID (roles use string IDs, not GUIDs)
const isValidId = (id: string): boolean => {
  return Boolean(id && id.length > 0 && id !== '0')
}

/* ---------------------------------- */
/* Select Column with Frontend Sorting */
/* ---------------------------------- */
const getSelectColumn = (): ColumnDef<IRole> => ({
  id: 'select',
  accessorFn: (row) => row.id,
  header: ({ table }) => <SelectAllCheckbox<IRole> table={table} />,
  cell: ({ row }) => {
    const isSelected = row.getIsSelected()
    const role = row.original
    
    return (
      <div className="flex justify-center">
        <div 
          className="cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleSelected(!isSelected)
          }}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
            isSelected
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 dark:from-blue-400 dark:to-indigo-500 dark:border-blue-400'
              : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
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
  fetchDetail: (item: IRole) => void
  handleEditClick: (item: IRole) => void
  confirmSoftDelete: (id: string) => void
  confirmRestore: (id: string) => void
  confirmPermanentDelete: (id: string) => void
  showDetail?: boolean
  showEdit?: boolean
  showSoftDelete?: boolean
  showRestore?: boolean
  showPermanentDelete?: boolean
}): ColumnDef<IRole>[] => [
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
          deletePermissions={['delete-admin-roles']}
          restorePermissions={['restore-admin-roles']}
          permanentDeletePermissions={['delete-admin-roles']}
        />
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: false,
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ getValue }) => <span className="font-medium text-gray-700 dark:text-gray-300">{getValue() as string}</span>
  },
  {
    header: 'Guard Name',
    accessorKey: 'guardName',
    cell: ({ getValue }) => <span className="text-gray-600 dark:text-gray-400">{getValue() as string}</span>
  },
  {
    header: 'Permissions',
    accessorKey: 'permissions',
    cell: ({ getValue }) => {
      const perms = getValue() as string[] | undefined;
      return perms?.length ? (
        <ExpandableText text={perms.join(', ')} wordLimit={5} className="max-w-[300px] whitespace-pre-wrap break-all" />
      ) : <span className="text-gray-400">-</span>
    },
    meta: { customClassName: 'text-left min-w-[300px]' },
    enableSorting: false,
  },
  {
    header: 'Active',
    accessorKey: 'isActive',
    cell: ({ getValue }) => getValue() ? <span className="text-green-600">Yes</span> : <span className="text-red-500">No</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' }
  },
  {
    header: 'Deleted',
    accessorKey: 'isDeleted',
    cell: ({ getValue }) => getValue() ? <span className="text-red-500 font-semibold">Yes</span> : <span className="text-gray-600 dark:text-gray-400">No</span>,
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
/* Roles Component */
/* ---------------------------------- */
export default function Roles() {
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '')
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark'

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading
  } = useDetailModal<IRole>('/roles')

  const fetchDetailRef = useRef(fetchDetail)
  fetchDetailRef.current = fetchDetail

  const hasFetchedRef = useRef(false)
  const prevFiltersRef = useRef<Record<string, any>>({})

  const [visible, setVisible] = useState<ColumnDef<IRole>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [showAddButton, setShowAddButton] = useState(false)
  const [showTrashButton, setShowTrashButton] = useState(false)

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  // Delete dialogs state
  const [softDeleteDialogOpen, setSoftDeleteDialogOpen] = useState(false)
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteInfo, setDeleteInfo] = useState<DeleteInfoResponse | null>(null)
  const [checkingDelete, setCheckingDelete] = useState(false)

  // Bulk operations state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkRestoreDialogOpen, setBulkRestoreDialogOpen] = useState(false)
  const [bulkPermanentDeleteDialogOpen, setBulkPermanentDeleteDialogOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

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
  const showEdit = can(['update-admin-roles'])
  const showSoftDelete = can(['delete-admin-roles'])
  const showRestore = can(['restore-admin-roles'])
  const showPermanentDelete = can(['delete-admin-roles'])

  const {
    isOpen: isEditSheetOpen,
    itemToEdit: roleToEdit,
    openEdit: handleEditClick,
    closeEdit: closeEditSheet
  } = useEditSheet<IRole>()

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
      data: IRole[]
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

      const res = await getRoles({
        q,
        page,
        limit,
        sortBy,
        sortOrder,
        ...finalFilters
      })

      return {
        data: res.roles as IRole[],
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
  } = useTable<IRole>({
    fetcher: stableFetcher,
    defaultSort: 'createdAt',
    enableTrashView: true,
    minLoadingTime: 1000
  })

  /* ---------------- Delete Eligibility Check ---------------- */
  const checkDeleteEligibility = useCallback(async (id: string): Promise<boolean> => {
    setCheckingDelete(true)
    try {
      const info = await getRoleDeleteInfo(id)
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
      const response = await deleteRole(deleteId, false)
      
      if (response.status === 200) {
        dispatchShowToast({ 
          type: "success", 
          message: response.data?.message || "Role moved to trash successfully" 
        })
        setSoftDeleteDialogOpen(false)
        setDeleteId(null)
        fetchData()
        setSelectedRowIds({})
      } else {
        throw new Error(response.data?.message || "Failed to move role to trash")
      }
    } catch (error: any) {
      console.error('Soft delete failed:', error)
      let errorMessage = error.response?.data?.message || error.message || "Failed to move role to trash"
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
      const response = await deleteRole(deleteId, true)
      
      if (response.status === 200 && response.data) {
        dispatchShowToast({ 
          type: "success", 
          message: response.data.message || "Role permanently deleted successfully" 
        })
        setPermanentDeleteDialogOpen(false)
        setSoftDeleteDialogOpen(false)
        setDeleteId(null)
        fetchData()
        setSelectedRowIds({})
      } else {
        throw new Error(response.data?.message || "Failed to delete role")
      }
    } catch (error: any) {
      console.error('Permanent delete failed:', error)
      
      let errorMessage = error.response?.data?.message || error.message || "Failed to permanently delete role"
      
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
      await restoreRole(restoreId)
      dispatchShowToast({ type: "success", message: "Role restored successfully" })
      setRestoreDialogOpen(false)
      setRestoreId(null)
      fetchData()
      setSelectedRowIds({})
    } catch (error: any) {
      console.error('Failed to restore role:', error)
      let errorMessage = error.response?.data?.message || "Failed to restore role"
      dispatchShowToast({ type: "danger", message: errorMessage })
    } finally {
      setRestoreLoading(false)
    }
  }, [restoreId, fetchData])

  /* ---------------- Bulk Operations ---------------- */
  const getSelectedIds = useCallback(() => {
    return Object.keys(selectedRowIds).filter(id => selectedRowIds[id] && isValidId(id))
  }, [selectedRowIds])

  const handleBulkDelete = useCallback(() => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) {
      dispatchShowToast({ type: "warning", message: "No roles selected for deletion" })
      return
    }
    setBulkDeleteDialogOpen(true)
  }, [getSelectedIds])

  const handleBulkRestore = useCallback(() => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) {
      dispatchShowToast({ type: "warning", message: "No roles selected for restore" })
      return
    }
    setBulkRestoreDialogOpen(true)
  }, [getSelectedIds])

  const handleBulkPermanentDelete = useCallback(() => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) {
      dispatchShowToast({ type: "warning", message: "No roles selected for permanent deletion" })
      return
    }
    setBulkPermanentDeleteDialogOpen(true)
  }, [getSelectedIds])

  const executeBulkSoftDelete = useCallback(async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return
    
    setBulkLoading(true)
    try {
      await bulkDeleteRoles(selectedIds, false)
      dispatchShowToast({ type: "success", message: `${selectedIds.length} role(s) moved to trash successfully` })
      setBulkDeleteDialogOpen(false)
      setSelectedRowIds({})
      fetchData()
    } catch (error: any) {
      console.error('Bulk soft delete failed:', error)
      dispatchShowToast({ type: "danger", message: error.response?.data?.message || "Failed to move roles to trash" })
    } finally {
      setBulkLoading(false)
    }
  }, [getSelectedIds, fetchData])

  const executeBulkRestore = useCallback(async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return
    
    setBulkLoading(true)
    try {
      await bulkRestoreRoles(selectedIds)
      dispatchShowToast({ type: "success", message: `${selectedIds.length} role(s) restored successfully` })
      setBulkRestoreDialogOpen(false)
      setSelectedRowIds({})
      fetchData()
    } catch (error: any) {
      console.error('Bulk restore failed:', error)
      dispatchShowToast({ type: "danger", message: error.response?.data?.message || "Failed to restore roles" })
    } finally {
      setBulkLoading(false)
    }
  }, [getSelectedIds, fetchData])

  const executeBulkPermanentDelete = useCallback(async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return
    
    setBulkLoading(true)
    try {
      await bulkDeleteRoles(selectedIds, true)
      dispatchShowToast({ type: "success", message: `${selectedIds.length} role(s) permanently deleted successfully` })
      setBulkPermanentDeleteDialogOpen(false)
      setSelectedRowIds({})
      fetchData()
    } catch (error: any) {
      console.error('Bulk permanent delete failed:', error)
      dispatchShowToast({ type: "danger", message: error.response?.data?.message || "Failed to permanently delete roles" })
    } finally {
      setBulkLoading(false)
    }
  }, [getSelectedIds, fetchData])

  /* ---------------- Stable Columns ---------------- */
  const selectColumn = useMemo(() => getSelectColumn(), [])
  const dataColumns = useMemo(() => getDataColumns({
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
  }), [pageIndex, pageSize, fetchDetail, handleEditClick, confirmSoftDelete, confirmRestore, confirmPermanentDelete, showDetail, showEdit, showSoftDelete, showRestore, showPermanentDelete])

  const allColumns = useMemo(() => [selectColumn, ...dataColumns], [selectColumn, dataColumns])
  const allColumnsRef = useRef(allColumns)
  allColumnsRef.current = allColumns

  /* ---------------- Add Button Permission ---------------- */
  useEffect(() => {
    setShowAddButton(can(['create-admin-roles']))
    setShowTrashButton(can(['restore-admin-roles']))
  }, [])

  /* ---------------- Load Column Settings ---------------- */
  useEffect(() => {
    if (!userId) return

    let mounted = true

    const loadColumnSettings = async () => {
      try {
        const { visibleColumns } = await refreshColumnSettings<IRole>(
          'roleTable',
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
  const table = useReactTable<IRole>({
    data,
    columns: visible,
    getRowId: (row) => row.id,
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
      <div className="flex justify-start mb-2">
        {viewIndicator && <TrashViewIndicator type={viewIndicator.type} />}
      </div>
      <TableHeaderActions
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onAddNew={() => setIsSheetOpen(true)}
        showAddButton={showAddButton}
        showTrashButton={showTrashButton}
        showBulkActions={true}
        selectedCount={Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length}
        onBulkDelete={!showTrash ? handleBulkDelete : undefined}
        onBulkRestore={showTrash ? handleBulkRestore : undefined}
        onBulkPermanentDelete={showTrash ? handleBulkPermanentDelete : undefined}
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
        showResetSorting={sorting.length > 0 && sorting[0]?.id === 'select'}
        onResetSorting={handleResetSorting}
        onColumnSettings={() => setShowColumnModal(true)}
        onPrint={() => printTableById('printable-role-table', 'Roles')}
        onExport={() =>
          exportVisibleTableToExcel({
            data,
            columns: allColumns,
            visibleColumnIds: visibleIds,
            fileName: 'Roles'
          })
        }
        onFilter={() => setFilterModalOpen(true)}
        isFilterActive={isFilterActive}
      />
      
      {/* TABLE - Glass Design */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
        <TableWithLoader loading={loading} id="printable-role-table" containerClassName="max-h-[600px] min-h-[200px] overflow-auto relative">
          {showEmptyState ? (
            <EmptyState 
              message={showTrash ? "No deleted roles found" : "No roles found"}
              suggestion={showTrash ? "Deleted roles will appear here once you move them to trash." : "Try adjusting your search or filter criteria to see more results."}
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-gray-200/50 dark:border-gray-700/50">
                    {headerGroup.headers.map((header) => {
                      const isSortable = header.column.getCanSort()
                      
                      return (
                        <th
                          key={header.id}
                          className={`p-4 text-center font-semibold ${header.column.columnDef.meta?.customClassName || ''}`}
                          style={{
                            background: isDarkMode
                              ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                              : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                            backdropFilter: 'blur(8px)',
                            cursor: isSortable ? 'pointer' : 'default'
                          }}
                          onClick={(event) => {
                            if (isSortable) {
                              const handler = header.column.getToggleSortingHandler()
                              if (handler) handler(event)
                            }
                          }}
                        >
                          <div className="flex justify-between items-center w-full gap-2">
                            <span className="flex-1 text-center text-gray-800 dark:text-gray-200 font-semibold">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {isSortable && (
                              <span className="relative">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <FaSortUp className="text-purple-600 dark:text-purple-400" size={12} />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <FaSortDown className="text-purple-600 dark:text-purple-400" size={12} />
                                ) : (
                                  <FaSort className="text-gray-500 dark:text-gray-500" size={12} />
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
                {table.getRowModel().rows.map((row, index) => (
                  <tr 
                    key={row.id} 
                    className={cn(
                      "transition-all duration-200",
                      "border-b border-gray-200/40 dark:border-gray-700/30",
                      index !== table.getRowModel().rows.length - 1 && "border-b",
                      row.getIsSelected() && "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5",
                      !row.getIsSelected() && "hover:bg-white/20 dark:hover:bg-white/5"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`p-4 text-gray-700 dark:text-gray-300 ${cell.column.columnDef.meta?.tdClassName || ''}`}
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

      {/* Role Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Role Details"
        widthPercent={60}
      >
        {detailLoading || !selectedItem ? (
          <TableLoader loading />
        ) : (
          <RoleDetail role={selectedItem} onUpdated={fetchData} />
        )}
      </Modal>

      {/* Column Manager */}
      {showColumnModal && (
        <ColumnVisibilityManager<IRole>
          tableId="roleTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        tableId="roleTable"
        title="Filter Roles"
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
          <RoleFilterForm
            filterValues={filterValues}
            setFilterValues={setFilterValues}
            onResetRef={resetRef}
            onClose={() => setFilterModalOpen(false)}
            showTrash={showTrash}
            onShowTrashChange={(newShowTrash: boolean) => {
              if (newShowTrash && !showTrash) {
                handleTrashClick();
              } else if (!newShowTrash && showTrash) {
                handleStoreClick();
              }
            }}
          />
        )}
      />

      {/* Add Role Sheet */}
      {showAddButton && (
        <FormHolderSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          title="Add New Role"
          titleDivClassName="success-gradient"
        >
          <AddRole fetchData={fetchData} onClose={() => setIsSheetOpen(false)} />
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
            This role will be moved to trash. You can restore it later.
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
        title="Permanently Delete Role"
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
            This will permanently delete the role and all associated data including:
          </p>
          
          <ul className="space-y-2 ml-4">
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Role-permission assignments
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              User-role assignments
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
          title="Restore Role"
          variant="success"
          icon={<RotateCcw className="w-6 h-6" />}
          confirmLabel={restoreLoading ? 'Restoring...' : 'Restore'}
          loading={restoreLoading}
        >
          <div className="space-y-3">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Are you sure you want to restore this role?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The role will be moved back to active roles with all its permissions.
            </p>
          </div>
        </ConfirmDialog>
      )}

      {/* Error Dialog */}
      <ConfirmDialog
        open={errorDialogOpen}
        onCancel={() => setErrorDialogOpen(false)}
        onConfirm={() => setErrorDialogOpen(false)}
        title="Cannot Delete Role"
        variant="destructive"
        icon={<XCircle className="w-6 h-6" />}
        confirmLabel="OK"
        showCancelButton={false}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <Database className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">
              {errorDetails?.message || "This role has existing related records"}
            </p>
          </div>
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please move this role to trash instead, or manually remove the related records first.
            </p>
          </div>
        </div>
      </ConfirmDialog>

      {/* Edit Role Sheet */}
      {showEdit && (
        <FormHolderSheet
          open={isEditSheetOpen}
          onOpenChange={closeEditSheet}
          title="Edit Role"
          titleDivClassName="warning-gradient"
        >
          {roleToEdit && (
            <EditRole
              roleId={roleToEdit.id}
              onClose={closeEditSheet}
              fetchData={fetchData}
            />
          )}
        </FormHolderSheet>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onCancel={() => setBulkDeleteDialogOpen(false)}
        onConfirm={executeBulkSoftDelete}
        title="Bulk Move to Trash"
        variant="warning"
        icon={<Archive className="w-6 h-6" />}
        confirmLabel={bulkLoading ? 'Moving to Trash...' : 'Move to Trash'}
        loading={bulkLoading}
      >
        <div className="space-y-3">
          <p className="text-yellow-600 dark:text-yellow-400 font-medium">
            Are you sure you want to move {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected role(s) to trash?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These roles can be restored later from the trash view.
          </p>
        </div>
      </ConfirmDialog>

      {/* Bulk Restore Confirmation Dialog */}
      <ConfirmDialog
        open={bulkRestoreDialogOpen}
        onCancel={() => setBulkRestoreDialogOpen(false)}
        onConfirm={executeBulkRestore}
        title="Bulk Restore Roles"
        variant="success"
        icon={<RotateCcw className="w-6 h-6" />}
        confirmLabel={bulkLoading ? 'Restoring...' : 'Restore'}
        loading={bulkLoading}
      >
        <div className="space-y-3">
          <p className="text-green-600 dark:text-green-400 font-medium">
            Are you sure you want to restore {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected role(s)?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These roles will be moved back to active roles.
          </p>
        </div>
      </ConfirmDialog>

      {/* Bulk Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        open={bulkPermanentDeleteDialogOpen}
        onCancel={() => setBulkPermanentDeleteDialogOpen(false)}
        onConfirm={executeBulkPermanentDelete}
        title="Bulk Permanently Delete Roles"
        variant="destructive"
        icon={<FileWarning className="w-6 h-6" />}
        confirmLabel={bulkLoading ? 'Permanently Deleting...' : 'Permanently Delete'}
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
            Are you sure you want to permanently delete {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected role(s)?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will permanently delete all selected roles and their associated data.
          </p>
        </div>
      </ConfirmDialog>
    </motion.div>
  )
}