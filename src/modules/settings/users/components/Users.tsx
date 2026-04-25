// app/(dashboard)/admin/users/Users.tsx

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

import api from '@/lib/axios'
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
import { getCustomDateTime, getPassedTime } from '@/lib/formatDate'
import { ExpandableText } from '@/components/custom/ExpandableText'
import { FilterModal } from '@/components/custom/FilterModal'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'

import UserDetail from './UserDetail'
import type { IUser } from '@/types'
import { UserFilterForm } from './UserFilterForm'
import Fancybox from '@/components/custom/FancyBox'
import { generateQRImage } from '@/lib/generateQRImage'
import { can } from '@/lib/authCheck'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import Add from './Add'
import Edit from './Edit'
import { useEditSheet } from '@/hooks/useEditSheet'
import { capitalize } from '@/lib/helpers'
import { useAppSelector } from '@/hooks/useRedux'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import { deleteUser, restoreUser, getDeleteInfo, bulkDeleteUsers, bulkRestoreUsers } from './../api'
import { AlertTriangle, Archive, FileWarning, Info, RotateCcw, Trash2, Database, XCircle } from 'lucide-react'
import { dispatchShowToast } from '@/lib/dispatch'
import { isValidGuid } from '@/lib/validations'
import { cn } from '@/lib/utils'

interface DeleteInfoResponse {
  canBePermanent: boolean
  message: string
  hasRelatedRecords?: boolean
  hasVerifiedEmail?: boolean
  blockingConstraints?: string[]  
}

/* ---------------------------------- */
/* Columns Definition - Updated with Permanent Delete */
/* ---------------------------------- */
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  handleEditClick,
  confirmDelete,
  confirmRestore,
  confirmPermanentDelete,
  authRoles,
  showDetail = true,
  showEdit = true,
  showDelete = true,
  showRestore = true,
  showPermanentDelete = true
}: {
    pageIndex: number
    pageSize: number
    fetchDetail: (item: IUser) => void
    handleEditClick: (item: IUser) => void
    confirmDelete: (id: string) => void
    confirmRestore: (id: string) => void
    confirmPermanentDelete: (id: string) => void
    authRoles: string[]
    showDetail?: boolean
    showEdit?: boolean
    showDelete?: boolean
    showRestore?: boolean
    showPermanentDelete?: boolean
}): ColumnDef<IUser>[] => [
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
      const hasDeveloperRole = row.original.roles?.includes('developer') || 
                                (row.original as any).roleNames?.split(',').map((r: string) => r.trim()).includes('developer');
      
      return (
        <RowActions
          row={row.original}
          onDetail={() => fetchDetail(row.original)}
          onEdit={!isDeleted ? () => handleEditClick(row.original) : undefined}
          onDelete={!isDeleted && showDelete && !hasDeveloperRole ? () => confirmDelete(row.original.id) : undefined}
          onRestore={isDeleted && showRestore ? () => confirmRestore(row.original.id) : undefined}
          onPermanentDelete={isDeleted && showPermanentDelete ? () => confirmPermanentDelete(row.original.id) : undefined}
          showDetail={showDetail}
          showEdit={showEdit && !isDeleted}
          showDelete={showDelete && !isDeleted && !hasDeveloperRole}
          showRestore={showRestore && isDeleted}
          showPermanentDelete={showPermanentDelete && isDeleted}
          deletePermissions={['delete-admin-users']}
          restorePermissions={['restore-admin-users']}
          permanentDeletePermissions={['delete-admin-users']}
        />
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: false,
  },
  {
    header: 'Profile Image',
    accessorKey: 'profileImage',
    cell: ({ row, getValue }) => {
      const user = row.original
      const src = getValue()
        ? import.meta.env.VITE_API_ASSET_URL + (getValue() as string)
        : '/human.png'

      return (
        <div className="flex justify-center">
          <Fancybox
            src={src}
            title={user.name}
            description={
              <>
                <div>{user.email}</div>
                {user.mobileNo && <div>{user.mobileNo}</div>}
              </>
            }
            alt="Profile Image"
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: false,
  },
  {
    header: 'QR Code',
    accessorKey: 'qrCode',
    cell: ({ row, getValue }) => {
      const user = row.original
      const qr = getValue() as string | null
      const [qrImg, setQrImg] = useState<string | null>(null)

      useEffect(() => {
        if (qr) generateQRImage(qr).then(setQrImg)
      }, [qr])

      if (!qr || !qrImg) return <span className="text-gray-400">-</span>

      return (
        <div className="flex flex-col items-center gap-1">
          <Fancybox
            src={qrImg}
            title={user.name}
            description={
              <>
                <div>{user.email}</div>
                {user.mobileNo && <div>{user.mobileNo}</div>}
              </>
            }
            alt="QR Code"
            isQRCode
            className="w-20 h-20"
          />
        </div>
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center min-w-[120px]' },
  },
  { header: 'Name', accessorKey: 'name' },
  { header: 'Username', accessorKey: 'username' },
  { header: 'Email', accessorKey: 'email' },
  { header: 'Mobile', accessorKey: 'mobileNo' },
  { header: 'NID', accessorKey: 'nid' },
  { 
    header: 'Gender', 
    accessorKey: 'gender', 
    cell: ({ getValue }) => getValue() ? capitalize(getValue() as string) : '-',
    meta: { customClassName: 'text-center', tdClassName: 'text-center' }
  },
  {
    header: 'Date of Birth',
    accessorKey: 'dateOfBirth',
    cell: ({ getValue }) =>
      getValue() ? (
        <>
          {getCustomDateTime(getValue() as string, 'YYYY-MM-DD')}
          <br />
          <small>
            ({getPassedTime(getCustomDateTime(getValue() as string, 'YYYY-MM-DD') as string, 'yearsOnly')})
          </small>
        </>
      ) : '-',
  },
  { 
    header: 'Email Verification', 
    accessorKey: 'emailVerifiedAt', 
    cell: ({ getValue }) => getValue() ? <span className="text-green-600 font-semibold">Verified <small className="text-xs text-gray-700 dark:text-gray-200">at {getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss')}</small></span> : <span className="text-red-500 font-semibold">Not Verified</span> 
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
    header: 'Deleted At', 
    accessorKey: 'deletedAt', 
    cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-',
    meta: { customClassName: 'text-center', tdClassName: 'text-center' }
  },
  { 
    header: 'Deleted By', 
    accessorKey: 'deletedByName', 
    cell: ({ getValue }) => getValue() || <span className="text-gray-400">-</span>,
    meta: { customClassName: 'text-center', tdClassName: 'text-center' }
  },
  { header: 'Roles', accessorKey: 'roles', cell: ({ getValue }) => (getValue() as string[] | undefined)?.join(', ') || <span className="text-gray-400">-</span> },
  { header: 'Permissions', accessorKey: 'permissions', cell: ({ getValue }) => { const perms = getValue() as string[] | undefined; return perms?.length ? <ExpandableText text={perms.join(', ')} wordLimit={10} className="max-w-[300px] whitespace-pre-wrap break-all" /> : <span className="text-gray-400">-</span> }, meta: { customClassName: 'text-left min-w-[300px]' } },
  { header: 'Address', accessorKey: 'address', cell: ({ getValue }) => getValue() ? <ExpandableText text={getValue() as string} wordLimit={10} className="max-w-[300px] whitespace-pre-wrap break-all" /> : <span className="text-gray-400">-</span>, meta: { customClassName: 'text-left min-w-[300px]' } },
  { header: 'Bio', accessorKey: 'bio', cell: ({ getValue }) => getValue() ? <ExpandableText text={getValue() as string} wordLimit={10} className="max-w-[300px] whitespace-pre-wrap break-all" /> : <span className="text-gray-400">-</span>, meta: { customClassName: 'text-left min-w-[300px]' } },
  { header: 'Last Updated At', accessorKey: 'updatedAt', cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-' },
  { header: 'Created At', accessorKey: 'createdAt', cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-' },
  { header: 'Created By', accessorKey: 'createdByName', cell: ({ getValue }) => getValue() || <span className="text-gray-400">-</span> },
  { header: 'Updated By', accessorKey: 'updatedByName', cell: ({ getValue }) => getValue() || <span className="text-gray-400">-</span> },
]

/* ---------------------------------- */
/* Users Component */
/* ---------------------------------- */
export default function Users() {
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '')
  const authroles = useAppSelector((state) => state.auth.user?.roles || [])

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading
  } = useDetailModal<IUser>('/users')

  const fetchDetailRef = useRef(fetchDetail)
  fetchDetailRef.current = fetchDetail

  const hasFetchedRef = useRef(false)
  const prevFiltersRef = useRef<Record<string, any>>({})

  const [visible, setVisible] = useState<ColumnDef<IUser>[]>([])
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
 const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
 const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
 const [bulkRestoreDialogOpen, setBulkRestoreDialogOpen] = useState(false)
 const [bulkPermanentDeleteDialogOpen, setBulkPermanentDeleteDialogOpen] = useState(false)
 const [bulkLoading, setBulkLoading] = useState(false)

  const showDetail = true
  const showEdit = can(['update-admin-users'])
  const showDelete = can(['delete-admin-users'])
  const showRestore = can(['restore-admin-users'])
  const showPermanentDelete = can(['delete-admin-users'])

  const {
    isOpen: isEditSheetOpen,
    itemToEdit: userToEdit,
    openEdit: handleEditClick,
    closeEdit: closeEditSheet
  } = useEditSheet<IUser>()


 
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
      data: IUser[]
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

      const res = await api.post('/users', {
        q,
        page,
        limit,
        sortBy,
        sortOrder,
        ...finalFilters
      })

      return {
        data: res.data.users as IUser[],
        total: res.data.totalCount,
        grandTotalCount: res.data.grandTotalCount
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
  } = useTable<IUser>({
    fetcher: stableFetcher,
    defaultSort: 'createdAt',
    enableTrashView: true,
    minLoadingTime: 1000
  })

  /* ---------------- Delete Handler with Relation Check ---------------- */
  const checkDeleteEligibility = useCallback(async (id: string): Promise<boolean> => {
    setCheckingDelete(true)
    try {
      const info = await getDeleteInfo(id)
      setDeleteInfo(info)
      
      const userToDelete = data.find(u => u.id === id)
      if (userToDelete?.roles?.includes('developer')) {
        setDeleteInfo({
          canBePermanent: false,
          message: 'Cannot delete user with Developer role. Please remove the Developer role first.',
          hasRelatedRecords: true,
          blockingConstraints: []
        })
        return false
      }
      
      return info.canBePermanent
    } catch (error) {
      console.error('Failed to get delete info:', error)
      setDeleteInfo({
        canBePermanent: false,
        message: 'Failed to check delete eligibility',
        blockingConstraints: []
      })
      return false
    } finally {
      setCheckingDelete(false)
    }
  }, [data])

  const confirmDelete = useCallback(async (id: string) => {
    setDeleteId(id)
    
    if (showTrash) {
      await checkDeleteEligibility(id)
      setPermanentDeleteDialogOpen(true)
    } else {
      const canBePermanent = await checkDeleteEligibility(id)
      
      if (canBePermanent) {
        setSoftDeleteDialogOpen(true)
      } else {
        setSoftDeleteDialogOpen(true)
      }
    }
  }, [showTrash, checkDeleteEligibility])

  const confirmPermanentDelete = useCallback((id: string) => {
    setDeleteId(id)
    checkDeleteEligibility(id)
    setPermanentDeleteDialogOpen(true)
  }, [checkDeleteEligibility])

  const handleSoftDelete = useCallback(async () => {
    if (!deleteId) return
    
    setDeleteLoading(true)
    try {
      const response = await deleteUser(deleteId, false)
      
      if (response.status === 200) {
        dispatchShowToast({ 
          type: "success", 
          message: response.data?.message || "User moved to trash successfully" 
        })
        setSoftDeleteDialogOpen(false)
        setDeleteId(null)
        fetchData()
      } else {
        throw new Error(response.data?.message || "Failed to move user to trash")
      }
    } catch (error: any) {
      console.error('Soft delete failed:', error)
      
      let errorMessage = "Failed to move user to trash"
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      dispatchShowToast({ 
        type: "danger", 
        message: errorMessage 
      })
      setSoftDeleteDialogOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteId, fetchData])

  const handlePermanentDelete = useCallback(async () => {
    if (!deleteId) return
    
    setDeleteLoading(true)
    try {
      const response = await deleteUser(deleteId, true)
      
      if (response.status === 200 && response.data) {
        dispatchShowToast({ 
          type: "success", 
          message: response.data.message || "User permanently deleted successfully" 
        })
        setPermanentDeleteDialogOpen(false)
        setSoftDeleteDialogOpen(false)
        setDeleteId(null)
        fetchData()
      } else {
        throw new Error(response.data?.message || "Failed to delete user")
      }
    } catch (error: any) {
      console.error('Permanent delete failed:', error)
      
      let errorMessage = "Failed to permanently delete user"
      let blockingTables: string[] | undefined
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.blockingTables) {
        blockingTables = error.response.data.blockingTables
      } else if (error.response?.data?.blockingConstraints && Array.isArray(error.response.data.blockingConstraints)) {
        blockingTables = error.response.data.blockingConstraints.map((c: any) => 
          typeof c === 'string' ? c : c.tableName || c.TableName
        )
      } else if (deleteInfo?.blockingConstraints && deleteInfo.blockingConstraints.length > 0) {
        blockingTables = deleteInfo.blockingConstraints
      }
      
      setErrorDetails({
        message: errorMessage,
        blockingTables: blockingTables
      })
      setErrorDialogOpen(true)
      setPermanentDeleteDialogOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteId, fetchData, deleteInfo])

  const cancelDelete = useCallback(() => {
    setSoftDeleteDialogOpen(false)
    setPermanentDeleteDialogOpen(false)
    setDeleteId(null)
    setDeleteInfo(null)
    setErrorDetails(null)
  }, [])

  const closeErrorDialog = useCallback(() => {
    setErrorDialogOpen(false)
    setErrorDetails(null)
  }, [])

  /* ---------------- Restore Handler ---------------- */
  const confirmRestore = useCallback((id: string) => {
    setRestoreId(id)
    setRestoreDialogOpen(true)
  }, [])

  const cancelRestore = useCallback(() => {
    setRestoreDialogOpen(false)
    setRestoreId(null)
  }, [])

  const handleRestore = useCallback(async () => {
    if (!restoreId) return
    
    setRestoreLoading(true)
    try {
      await restoreUser(restoreId)
      dispatchShowToast({ 
        type: "success", 
        message: "User restored successfully" 
      })
      setRestoreDialogOpen(false)
      setRestoreId(null)
      fetchData()
    } catch (error: any) {
      console.error('Failed to restore user:', error)
      let errorMessage = "Failed to restore user"
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      dispatchShowToast({ 
        type: "danger", 
        message: errorMessage 
      })
    } finally {
      setRestoreLoading(false)
    }
  }, [restoreId, fetchData])

  /* ---------------- Stable Columns ---------------- */
  // Create data columns using useCallback or useMemo with stable dependencies
  const dataColumns = useMemo(() => getAllColumns({
    pageIndex,
    pageSize,
    fetchDetail,
    handleEditClick,
    authRoles: authroles,
    confirmDelete,
    confirmRestore,
    confirmPermanentDelete,
    showDetail,
    showEdit,
    showDelete,
    showRestore,
    showPermanentDelete
  }), [
    pageIndex, 
    pageSize, 
    fetchDetail, 
    handleEditClick,
    confirmDelete, 
    confirmRestore, 
    confirmPermanentDelete,
    authroles, 
    showDetail, 
    showEdit, 
    showDelete, 
    showRestore, 
    showPermanentDelete
  ])

  // Make sure your selectColumn is using the actual user ID
  const selectColumn: ColumnDef<IUser> = useMemo(() => ({
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox<IUser> table={table} />,
    cell: ({ row }) => {
      const isSelected = row.getIsSelected()
      const user = row.original
      
      // Get the actual ID from the user object
      const userId = user.id
      
      // Check if user has developer role
      const hasDeveloperRole = user.roles?.includes('developer') || 
                                (user as any).roleNames?.split(',').map((r: string) => r.trim()).includes('developer')
      
      // Validate GUID format
      const isValidGuid = (id: string): boolean => {
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return guidRegex.test(id);
      }
      
      const isDisabled = hasDeveloperRole || !userId || !isValidGuid(userId)
      
      return (
        <div className="flex justify-center">
          <div 
            className={isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            onClick={(e) => {
              e.stopPropagation()
              if (!isDisabled) {
                row.toggleSelected(!isSelected)
              }
            }}
            title={isDisabled ? (hasDeveloperRole ? "Cannot select users with Developer role" : "Invalid user ID") : ""}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              isDisabled
                ? 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600 opacity-60'
                : isSelected
                  ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                  : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500'
            }`}>
              {isSelected && !isDisabled && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        </div>
      )
    },
    enableSorting: false,
  }), [])

  // Combine columns - also use useMemo
  const allColumns = useMemo(() => [selectColumn, ...dataColumns], [selectColumn, dataColumns])

  const allColumnsRef = useRef(allColumns)
  allColumnsRef.current = allColumns

  /* ---------------- Add Button Permission ---------------- */
  useEffect(() => {
    setShowAddButton(can(['create-admin-users']))
    setShowTrashButton(can(['restore-admin-users']))
  }, [])

  /* ---------------- Load Column Settings ---------------- */
  useEffect(() => {
    if (!userId) return

    let mounted = true

    const loadColumnSettings = async () => {
      try {
        const { visibleColumns } = await refreshColumnSettings<IUser>(
          'userTable',
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
  }, [userId])

  // Update getSelectedIds to filter invalid IDs
  const getSelectedIds = useCallback(() => {
      const selectedIds = Object.keys(selectedRowIds).filter(id => selectedRowIds[id]);
      // console.log('Selected IDs for bulk delete:', selectedIds);
      // Filter out invalid GUIDs
      const validIds = selectedIds.filter(isValidGuid);
      
      if (validIds.length !== selectedIds.length) {
        console.warn('Filtered out invalid IDs:', selectedIds.filter(id => !isValidGuid(id)));
      }
    
    return validIds;
  }, [selectedRowIds]);

    // Update bulk delete handler
  const handleBulkDelete = useCallback(() => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) {
      dispatchShowToast({
        type: "warning",
        message: "No valid users selected for deletion"
      });
      return;
    }
    setBulkDeleteDialogOpen(true);
  }, [getSelectedIds]);

  // Update bulk restore handler
  const handleBulkRestore = useCallback(() => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) {
      dispatchShowToast({
        type: "warning",
        message: "No valid users selected for restore"
      });
      return;
    }
    setBulkRestoreDialogOpen(true);
  }, [getSelectedIds]);

  // Update bulk permanent delete handler
  const handleBulkPermanentDelete = useCallback(() => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) {
      dispatchShowToast({
        type: "warning",
        message: "No valid users selected for permanent deletion"
      });
      return;
    }
    setBulkPermanentDeleteDialogOpen(true);
  }, [getSelectedIds]);

  // Execute bulk soft delete
  const executeBulkSoftDelete = useCallback(async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return
    
    setBulkLoading(true)
    try {
      await bulkDeleteUsers(selectedIds, false)
      dispatchShowToast({
        type: "success",
        message: `${selectedIds.length} user(s) moved to trash successfully`
      })
      setBulkDeleteDialogOpen(false)
      setSelectedRowIds({}) // Clear selection
      fetchData() // Refresh table
    } catch (error: any) {
      console.error('Bulk soft delete failed:', error)
      dispatchShowToast({
        type: "danger",
        message: error.response?.data?.message || "Failed to move users to trash"
      })
    } finally {
      setBulkLoading(false)
    }
  }, [getSelectedIds, fetchData])

  // Execute bulk restore
  const executeBulkRestore = useCallback(async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return
    
    setBulkLoading(true)
    try {
      await bulkRestoreUsers(selectedIds)
      dispatchShowToast({
        type: "success",
        message: `${selectedIds.length} user(s) restored successfully`
      })
      setBulkRestoreDialogOpen(false)
      setSelectedRowIds({}) // Clear selection
      fetchData() // Refresh table
    } catch (error: any) {
      console.error('Bulk restore failed:', error)
      dispatchShowToast({
        type: "danger",
        message: error.response?.data?.message || "Failed to restore users"
      })
    } finally {
      setBulkLoading(false)
    }
  }, [getSelectedIds, fetchData])

  // Execute bulk permanent delete
  const executeBulkPermanentDelete = useCallback(async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return
    
    // Filter out developer users from bulk permanent delete
    const developerUsers = data.filter(user => 
      selectedIds.includes(user.id) && 
      (user.roles?.includes('developer') || 
      (user as any).roleNames?.split(',').map((r: string) => r.trim()).includes('developer'))
    )
    
    if (developerUsers.length > 0) {
      dispatchShowToast({
        type: "warning",
        message: `Cannot permanently delete ${developerUsers.length} user(s) with Developer role. Please remove Developer role first.`
      })
      return
    }
    
    setBulkLoading(true)
    try {
      await bulkDeleteUsers(selectedIds, true)
      dispatchShowToast({
        type: "success",
        message: `${selectedIds.length} user(s) permanently deleted successfully`
      })
      setBulkPermanentDeleteDialogOpen(false)
      setSelectedRowIds({}) // Clear selection
      fetchData() // Refresh table
    } catch (error: any) {
      console.error('Bulk permanent delete failed:', error)
      dispatchShowToast({
        type: "danger",
        message: error.response?.data?.message || "Failed to permanently delete users"
      })
    } finally {
      setBulkLoading(false)
    }
  }, [getSelectedIds, fetchData, data])


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
    const table = useReactTable<IUser>({
      data,
      columns: visible,
      getRowId: (row) => row.id,
      state: {
        sorting,
        pagination: {
          pageIndex,
          pageSize
        },
        rowSelection: selectedRowIds,
      },
      enableRowSelection: (row) => {
        const user = row.original
        const hasDeveloperRole = user.roles?.includes('developer') || 
                                  (user as any).roleNames?.split(',').map((r: string) => r.trim()).includes('developer')
        return !hasDeveloperRole
      },
      onRowSelectionChange: (updater) => {
        // console.log('=== ON ROW SELECTION CHANGE ===')
        // console.log('20. Updater type:', typeof updater)
        // console.log('21. Current selectedRowIds:', selectedRowIds)
        
        let newSelection: Record<string, boolean>;
        
        if (typeof updater === 'function') {
          newSelection = updater(selectedRowIds);
          // console.log('22. New selection from function:', newSelection)
        } else {
          newSelection = updater;
          // console.log('23. New selection from object:', newSelection)
        }
        
        // Filter out invalid GUIDs
        const isValidGuid = (id: string): boolean => {
          const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return guidRegex.test(id);
        };
        
        const filteredSelection = Object.keys(newSelection).reduce((acc, key) => {
          if (isValidGuid(key) && newSelection[key]) {
            acc[key] = newSelection[key];
          }
          return acc;
        }, {} as Record<string, boolean>);
        
        // console.log('24. Filtered selection:', filteredSelection)
        // console.log('25. Filtered selection keys count:', Object.keys(filteredSelection).length)
        
        setSelectedRowIds(filteredSelection);
      },
      manualPagination: true,
      manualSorting: false, // Set to false to let React Table handle sorting internally
      pageCount: Math.ceil(totalCount / pageSize),
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
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
        onColumnSettings={() => setShowColumnModal(true)}
        onPrint={() => printTableById('printable-user-table', 'Users')}
        onExport={() =>
          exportVisibleTableToExcel({
            data,
            columns: allColumns,
            visibleColumnIds: visibleIds,
            fileName: 'Users'
          })
        }
        onFilter={() => setFilterModalOpen(true)}
        isFilterActive={isFilterActive}
      />
      
      {/* TABLE */}
      <TableWithLoader 
        loading={loading}
        id="printable-user-table"
      >
        <table className="table-auto w-full text-left border border-collapse">
          <thead className="sticky -top-1 z-10 bg-gray-200 dark:bg-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  // Check if column is sortable
                  const isSortable = header.column.getCanSort()
                  
                  return (
                    <th
                      key={header.id}
                      className={`p-2 border text-center ${header.column.columnDef.meta?.customClassName || ''}`}
                    >
                      <div
                        className={`flex justify-between items-center w-full ${isSortable ? 'cursor-pointer' : ''}`}
                        onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <span className="flex-1 text-center">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {isSortable && (
                          <span className="ml-2">
                            {header.column.getIsSorted() === 'asc' ? (
                              <FaSortUp size={12} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <FaSortDown size={12} />
                            ) : (
                              <FaSort size={12} />
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="User Details"
        widthPercent={70}
      >
        {detailLoading || !selectedItem ? (
          <TableLoader loading />
        ) : (
          <UserDetail user={selectedItem} onUpdated={fetchData} />
        )}
      </Modal>

      {showColumnModal && (
        <ColumnVisibilityManager<IUser>
          tableId="userTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      <FilterModal
        tableId="userTable"
        title="Filter Users"
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
          <UserFilterForm
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

      {showAddButton && (
        <FormHolderSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          title="Add New User"
          titleDivClassName="success-gradient"
        >
          <Add fetchData={fetchData} />
        </FormHolderSheet>
      )}

      {/* Move to Trash Dialog */}
      <ConfirmDialog
        open={softDeleteDialogOpen && deleteInfo?.canBePermanent === false}
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
            This user will be moved to trash.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can restore them later from the trash view.
          </p>
          {deleteInfo?.message && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {deleteInfo.message}
              </p>
            </div>
          )}
        </div>
      </ConfirmDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        open={permanentDeleteDialogOpen}
        onCancel={cancelDelete}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete User"
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
            This will permanently delete the user and all associated data including:
          </p>
          
          <ul className="space-y-2 ml-4">
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Profile image file
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Role and permission assignments
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Email verification records
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              All activity logs
            </li>
          </ul>

          {deleteInfo?.message && !deleteInfo.canBePermanent && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {deleteInfo.message}
              </p>
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
          title="Restore User"
          variant="success"
          icon={<RotateCcw className="w-6 h-6" />}
          confirmLabel={restoreLoading ? 'Restoring...' : 'Restore'}
          loading={restoreLoading}
        >
          <div className="space-y-3">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Are you sure you want to restore this user?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The user will be moved back to active users and all their data will be restored.
            </p>
          </div>
        </ConfirmDialog>
      )}

      {/* Delete Type Selection Dialog */}
      <ConfirmDialog
        open={softDeleteDialogOpen && deleteInfo?.canBePermanent === true && !showTrash}
        onCancel={cancelDelete}
        onConfirm={handleSoftDelete}
        onPermanentDelete={handlePermanentDelete}
        title="Choose Delete Option"
        variant="info"
        icon={<Info className="w-6 h-6" />}
        showConfirmButton={false}
        showPermanentDeleteButton={true}
        permanentDeleteLabel="Permanently Delete"
        confirmLabel="Move to Trash"
        loading={deleteLoading}
      >
        <div className="space-y-3">
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            This user can be permanently deleted or moved to trash.
          </p>
          
          {deleteInfo?.message && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ {deleteInfo.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <Trash2 className="w-4 h-4 text-red-600 mb-2" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Permanent Delete</p>
              <p className="text-xs text-red-600/70 mt-1">Complete removal (cannot undo)</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Archive className="w-4 h-4 text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Move to Trash</p>
              <p className="text-xs text-yellow-600/70 mt-1">Soft delete (can restore later)</p>
            </div>
          </div>
        </div>
      </ConfirmDialog>

      {/* Error Dialog */}
      <ConfirmDialog
        open={errorDialogOpen}
        onCancel={closeErrorDialog}
        onConfirm={closeErrorDialog}
        title="Cannot Delete User"
        variant="destructive"
        icon={<XCircle className="w-6 h-6" />}
        confirmLabel="OK"
        showCancelButton={false}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <Database className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">
              {errorDetails?.message || "This user has existing related records in other modules"}
            </p>
          </div>
          
          {errorDetails?.blockingTables && errorDetails.blockingTables.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Related data found in:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {errorDetails.blockingTables.map((tableName, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {tableName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please move this user to trash instead, or manually remove the related records first.
            </p>
          </div>
        </div>
      </ConfirmDialog>

      {/* Edit User Sheet */}
      {showEdit && (
        <FormHolderSheet
          open={isEditSheetOpen}
          onOpenChange={closeEditSheet}
          title="Edit User"
          titleDivClassName="warning-gradient"
        >
          {userToEdit && (
            <Edit
              userId={userToEdit.id as string}
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
            Are you sure you want to move {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected user(s) to trash?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These users can be restored later from the trash view.
          </p>
        </div>
      </ConfirmDialog>

      {/* Bulk Restore Confirmation Dialog */}
      <ConfirmDialog
        open={bulkRestoreDialogOpen}
        onCancel={() => setBulkRestoreDialogOpen(false)}
        onConfirm={executeBulkRestore}
        title="Bulk Restore Users"
        variant="success"
        icon={<RotateCcw className="w-6 h-6" />}
        confirmLabel={bulkLoading ? 'Restoring...' : 'Restore'}
        loading={bulkLoading}
      >
        <div className="space-y-3">
          <p className="text-green-600 dark:text-green-400 font-medium">
            Are you sure you want to restore {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected user(s)?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These users will be moved back to active users.
          </p>
        </div>
      </ConfirmDialog>

      {/* Bulk Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        open={bulkPermanentDeleteDialogOpen}
        onCancel={() => setBulkPermanentDeleteDialogOpen(false)}
        onConfirm={executeBulkPermanentDelete}
        title="Bulk Permanently Delete Users"
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
            Are you sure you want to permanently delete {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected user(s)?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will permanently delete all selected users and their associated data.
          </p>
        </div>
      </ConfirmDialog>
    </motion.div>
  )
}