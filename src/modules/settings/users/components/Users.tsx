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
  TableWithLoader
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
import { useDeleteWithConfirm } from '@/hooks/useDeleteWithConfirm'
import { useAppSelector } from '@/hooks/useRedux'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import { deleteUser, restoreUser } from './../api'

/* ---------------------------------- */
/* Columns Definition */
/* ---------------------------------- */
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
  handleEditClick,
  confirmDelete,
  confirmRestore,
  authRoles,
  showDetail = true,
  showEdit = true,
  showDelete = true,
  showRestore = true
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (item: IUser) => void
  handleEditClick: (item: IUser) => void
  confirmDelete: (id: string) => void
  confirmRestore: (id: string) => void
  authRoles: string[]
  showDetail?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showRestore?: boolean
}): ColumnDef<IUser>[] => [
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
          onDelete={!isDeleted ? () => confirmDelete(row.original.id) : undefined}
          onRestore={isDeleted ? () => confirmRestore(row.original.id) : undefined}
          showDetail={showDetail}
          showEdit={showEdit && !isDeleted}
          showDelete={showDelete && !isDeleted && !(row.original as any).roleNames?.split(',').map((r: string) => r.trim()).includes('developer')}
          showRestore={showRestore && isDeleted}
        />
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
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
    cell: ({ getValue }) => getValue() ? capitalize(getValue() as string) : '-' 
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
    cell: ({ getValue }) => getValue() ? 'Yes' : <span className="text-red-500">No</span> 
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

  // Restore dialog state
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [restoreId, setRestoreId] = useState<string | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)

  const showDetail = true
  const showEdit = can(['read-admin-dashboard'])
  const showDelete = can(['read-admin-dashboard'])
  const showRestore = can(['read-admin-dashboard'])

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

  /* ---------------- Delete Hook ---------------- */
  // Moved AFTER fetchData is defined
  const {
    dialogOpen,
    confirmDelete,
    cancelDelete,
    handleDelete,
    deleteLoading
  } = useDeleteWithConfirm({
    deleteFunction: async (id: string) => deleteUser(id, true),
    onSuccess: fetchData,
    successMessage: 'User deleted successfully',
    errorMessage: 'Failed to delete user',
    inactiveMessage: 'User cannot be deleted'
  })

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
      setRestoreDialogOpen(false)
      setRestoreId(null)
      fetchData() // Refresh the data
    } catch (error) {
      console.error('Failed to restore user:', error)
    } finally {
      setRestoreLoading(false)
    }
  }, [restoreId, fetchData])

  /* ---------------- Stable Columns ---------------- */
  const allColumnsRef = useRef<ColumnDef<IUser>[]>([])

  if (!allColumnsRef.current.length) {
    allColumnsRef.current = getAllColumns({
      pageIndex,
      pageSize,
      fetchDetail,
      handleEditClick,
      authRoles: authroles,
      confirmDelete,
      confirmRestore,
      showDetail,
      showEdit,
      showDelete,
      showRestore
    })
  }

  const allColumns = allColumnsRef.current

  /* ---------------- Add Button Permission ---------------- */
  useEffect(() => {
    setShowAddButton(can(['read-admin-dashboard']))
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

  /* ---------------- Empty State ---------------- */
  const showEmptyState = !loading && !error && data.length === 0
  const showErrorState = !loading && error

  const tableHeader = (
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
    </table>
  )

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
        {/* Always show the complete table structure */}
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
                    message="Error loading users"
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
                    message="No users found"
                    suggestion="Try adjusting your filters or add a new user"
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

      {/* USER DETAIL */}
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

      {/* COLUMN MANAGER */}
      {showColumnModal && (
        <ColumnVisibilityManager<IUser>
          tableId="userTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      {/* FILTER MODAL */}
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
            onClose={() => setFilterModalOpen(false)}
            onResetRef={resetRef}
          />
        )}
      />

      {/* ADD USER */}
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

      {/* DELETE CONFIRMATION */}
      {showDelete && (
        <ConfirmDialog
          open={dialogOpen}
          onCancel={cancelDelete}
          onConfirm={handleDelete}
          title="Confirm Deletion"
          description="Are you sure you want to delete this user"
          confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
          loading={deleteLoading}
        />
      )}

      {/* RESTORE CONFIRMATION */}
      {showRestore && (
        <ConfirmDialog
          open={restoreDialogOpen}
          onCancel={cancelRestore}
          onConfirm={handleRestore}
          title="Confirm Restore"
          description="Are you sure you want to restore this user"
          confirmLabel={restoreLoading ? 'Restoring...' : 'Restore'}
          loading={restoreLoading}
          variant='success'
        />
      )}

      {/* EDIT USER */}
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
    </motion.div>
  )
}