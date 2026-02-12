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
import { capitalize } from '@/lib/helpers'

/* ---------------------------------- */
/* Columns */
/* ---------------------------------- */
const getAllColumns = ({
  pageIndex,
  pageSize,
  fetchDetail,
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (item: IUser | string) => void
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
    cell: ({ row }) => (
      <RowActions
        row={row.original}
        onDetail={() => fetchDetail(row.original)}
        showDetail
      />
    ),
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
  },
  {
    header: 'Profile Image',
    accessorKey: 'profileImage',
    cell: ({ row, getValue }) => {
      const user = row.original
      const src = (getValue() as string)? import.meta.env.VITE_API_BASE_URL + (getValue() as string) || '/human.png' : '/human.png'

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

    // New QR Code Column
  {
    header: 'QR Code',
    accessorKey: 'qrCode',
    cell: ({ row, getValue }) => {
      const user = row.original
      const qr = getValue() as string | null
      const [qrImg, setQrImg] = useState<string | null>(null)

      useEffect(() => {
        if (qr) {
          generateQRImage(qr).then(setQrImg)
        }
      }, [qr])

      if (!qr || !qrImg) {
        return <span className="text-gray-400">-</span>
      }

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
          {/* <span className="text-xs text-gray-500 break-all max-w-[80px] text-center">
            {qr}
          </span> */}
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
  { header: 'Gender', accessorKey: 'gender', cell: ({ getValue }) => ((getValue()!=null)?capitalize(getValue() as string) ?? '-' : '-') },
  // { header: 'Timezone', accessorKey: 'timezone' },
  // { header: 'Language', accessorKey: 'language' },
  {
    header: 'Date of Birth',
    accessorKey: 'dateOfBirth',
    cell: ({ getValue }) =>
      getValue() ? (
        <>
          {getCustomDateTime(getValue() as string, 'YYYY-MM-DD')}
          <br />
          <small>
            ({getPassedTime(getCustomDateTime(getValue() as string, 'YYYY-MM-DD') as string,'yearsOnly')})
          </small>
        </>
      ) : '-',
  },
  { header: 'Email Verification', accessorKey: 'emailVerifiedAt', cell: ({ getValue }) => (
    getValue() ? (
      <span className="text-green-600 font-semibold">Verified <small className="text-xs text-gray-700 dark:text-gray-200">at {getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss')}</small></span>
    ) : (
      <span className="text-red-500 font-semibold">Not Verified</span>
    )
  )},
  {
    header: 'Active',
    accessorKey: 'isActive',
    cell: ({ getValue }) =>
      getValue() ? 'Yes' : <span className="text-red-500">No</span>,
  },
  {
    header: 'Roles',
    accessorKey: 'roles',
    cell: ({ getValue }) => {
      const roles = getValue() as string[] | undefined
      return roles && roles.length ? roles.join(', ') : <span className="text-gray-400">-</span>
    },
  },
  {
    header: 'Permissions',
    accessorKey: 'permissions',
    cell: ({ getValue }) => {
      const perms = getValue() as string[] | undefined
      if (!perms || !perms.length) return <span className="text-gray-400">-</span>
      return <ExpandableText text={perms.join(', ')} wordLimit={10} className="max-w-[300px] whitespace-pre-wrap break-all" />
    },
    meta: { customClassName: 'text-left min-w-[300px]'},
  },
  {
    header: 'Address',
    accessorKey: 'address',
    cell: ({ getValue }) => {
      const val = getValue() as string
      if (!val) return <span className="text-gray-400">-</span>
      return <ExpandableText text={val} wordLimit={10} className="max-w-[300px] whitespace-pre-wrap break-all" />
    },
    meta: { customClassName: 'text-left min-w-[300px]'},
  },
  {
    header: 'Bio',
    accessorKey: 'bio',
    cell: ({ getValue }) => {
      const val = getValue() as string
      if (!val) return <span className="text-gray-400">-</span>
      return <ExpandableText text={val} wordLimit={10} className="max-w-[300px] whitespace-pre-wrap break-all" />
    },
    meta: { customClassName: 'text-left min-w-[300px]'},
  },
  {
    header: 'Last Updated At',
    accessorKey: 'updatedAt',
    cell: ({ getValue }) =>
      getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    cell: ({ getValue }) =>
      getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    header: 'Created By',
    accessorKey: 'createdByName',
    cell: ({ getValue }) => getValue() || <span className="text-gray-400">-</span>,
  },
  {
    header: 'Updated By',
    accessorKey: 'updatedByName',
    cell: ({ getValue }) => getValue() || <span className="text-gray-400">-</span>,
  },
]

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */
export default function Users() {
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '')
  const { isModalOpen, selectedItem, fetchDetail, closeModal, detailLoading } =
    useDetailModal<IUser>('/users')

  const fetchDetailRef = useRef(fetchDetail)
  fetchDetailRef.current = fetchDetail

  const [visible, setVisible] = useState<ColumnDef<IUser>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [showAddButton,setShowAddButton]= useState(false)

  // Stable fetcher function
  const stableFetcher = useCallback(
    async ({
      q = '',
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    }: {
      q?: string
      page: number
      limit: number
      sortBy?: string
      sortOrder?: string
    }): Promise<{ data: IUser[]; total: number; grandTotalCount: number }> => {
      const res = await api.post('/users', {
        q,
        page,
        limit,
        sortBy,
        sortOrder,
        ...filters,
      })
      return {
        data: res.data.users as IUser[],
        total: res.data.users.length,
        grandTotalCount: res.data.grandTotalCount,
      }
    },
    [filters]
  )

  const {
    data,
    totalCount,
    grandTotalCount,
    loading,
    sorting,
    setSorting,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    fetchData,
    globalFilter,
    setGlobalFilter,
  } = useTable<IUser>({
    fetcher: stableFetcher,
    defaultSort: 'createdAt',
  })

  const allColumns = useMemo(
    () =>
      getAllColumns({
        pageIndex,
        pageSize,
        fetchDetail: item => fetchDetailRef.current(item),
      }),
    [pageIndex, pageSize]
  )

  useEffect(() => {
    setShowAddButton(can(['read-admin-dashboard']))
  },[])

  // Load column visibility from backend or default
  useEffect(() => {
    if (!userId) return
    let mounted = true
    ;(async () => {
      try {
        const { visibleColumns } = await refreshColumnSettings<IUser>('userTable', userId, allColumns)
        if (mounted) setVisible(visibleColumns.length ? visibleColumns : allColumns)
      } catch (err) {
        console.error(err)
      }
    })()
    return () => { mounted = false }
  }, [userId, allColumns])

  useEffect(() => { fetchData() }, [fetchData])

  const visibleIds = visible.map(c => c.id ?? ((c as any).accessorKey ?? ''))
  const isFilterActive = Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))

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
          onAddNew={() => setIsSheetOpen(true)}
          showAddButton={showAddButton}
          onColumnSettings={() => setShowColumnModal(true)}
          onPrint={() => printTableById('printable-user-table', 'Users')}
          onExport={() => exportVisibleTableToExcel({ data, columns: allColumns, visibleColumnIds: visibleIds, fileName: 'Users' })}
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

            <table className="table-auto w-full text-left border border-collapse">
              <thead className="sticky -top-1 z-10 bg-gray-200 dark:bg-gray-700">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className={`p-2 border ${header.column.columnDef.meta?.customClassName || ''}`}>
                        <div className="flex justify-between items-center w-full cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          <span className="ml-2">
                            {header.column.getIsSorted() === 'asc' ? <FaSortUp size={12} /> : header.column.getIsSorted() === 'desc' ? <FaSortDown size={12} /> : <FaSort size={12} />}
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
                      <td key={cell.id} className={`p-2 border ${cell.column.columnDef.meta?.tdClassName || ''}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>

        <TablePaginationFooter
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={totalCount}
          grandTotalCount={grandTotalCount}
          setPendingPage={setPageIndex}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
        />
      </div>

      {/* User Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="User Details" widthPercent={70}>
        {detailLoading || !selectedItem ? <TableLoader loading /> : <UserDetail user={selectedItem} />}
      </Modal>

      {/* Column Visibility Modal */}
      {showColumnModal && (
        <ColumnVisibilityManager<IUser>
          tableId="userTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      {/* Filter Modal */}
      {filterModalOpen && (
        <FilterModal
          tableId="userTable"
          title="Filter Users"
          open={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          onApply={newFilters => { setFilters(newFilters); setFilterModalOpen(false) }}
          initialFilters={filters}
          renderForm={(filterValues, setFilterValues, resetRef) => (<UserFilterForm filterValues={filterValues} setFilterValues={setFilterValues} onResetRef={resetRef} />)}
        />
      )}

      {showAddButton && <FormHolderSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="Add New User"
        titleDivClassName="success-gradient"
      >
        <Add fetchData={fetchData} />
      </FormHolderSheet>}
    </motion.div>
  )
}
