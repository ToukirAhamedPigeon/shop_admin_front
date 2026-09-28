// src/modules/settings/translations/components/Translations.tsx

import { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
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
  ErrorState,
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

import TranslationDetail from './TranslationDetail'
import type { ITranslation } from '@/types/translation'
import TranslationFilterForm from './TranslationFilterForm'
import { can } from '@/lib/authCheck'
import FormHolderSheet from '@/components/custom/FormHolderSheet'
import AddTranslation from './AddTranslation'
import EditTranslation from './EditTranslation'
import { useEditSheet } from '@/hooks/useEditSheet'
import ConfirmDialog from '@/components/custom/ConfirmDialog'
import { deleteTranslation, bulkDeleteTranslations, getTranslations, getTranslationModules, updateTranslation } from '../api'
import TranslationEditorList from './TranslationEditorList'
import { useRefreshTranslations } from '@/hooks/useRefreshTranslations'
import { dispatchShowToast } from '@/lib/dispatch'
import { cn } from '@/lib/utils'
import { AlertTriangle, Trash2, Globe, Languages, List } from 'lucide-react'

type TranslationView = 'editor' | 'table'
const VIEW_KEY = 'translations-view'
const readView = (): TranslationView => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'editor'
  } catch {
    return 'editor'
  }
}

function EditorSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-border" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid gap-3 px-3 py-3.5 lg:grid-cols-[28px_minmax(0,15rem)_minmax(0,1fr)_minmax(0,1fr)_104px]">
          <div className="hidden size-4 rounded bg-muted lg:block" />
          <div className="space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            <div className="h-4 w-16 rounded-full bg-muted" />
          </div>
          <div className="h-3.5 w-4/5 rounded bg-muted" />
          <div className="h-3.5 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

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
    const isSomeSelected = table.getIsSomeRowsSelected()
    const isAllSelected = table.getIsAllPageRowsSelected()
    
    return (
      <div 
        className="flex justify-center cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation()
          table.toggleAllPageRowsSelected(!isAllSelected)
        }}
      >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
          isAllSelected
            ? 'bg-primary border-primary'
            : isSomeSelected
              ? 'bg-primary/30 border-primary'
              : 'border-border bg-background hover:border-primary/50'
        }`}>
          {isAllSelected && (
            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {!isAllSelected && isSomeSelected && (
            <div className="w-2 h-0.5 bg-primary" />
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
          className="cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleSelected(!isSelected)
          }}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
            isSelected
              ? 'bg-primary border-primary'
              : 'border-border bg-background hover:border-primary/50'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
  showDetail = true,
  showEdit = true,
  showDelete = true,
}: {
  pageIndex: number
  pageSize: number
  fetchDetail: (item: ITranslation) => void
  handleEditClick: (item: ITranslation) => void
  confirmSoftDelete: (id: string) => void
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
          onDelete={() => confirmSoftDelete(row.original.id)}
          showDetail={showDetail}
          showEdit={showEdit}
          showDelete={showDelete}
          deletePermissions={['delete-admin-translations']}
        />
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: false,
  },
  {
    header: 'Key',
    accessorKey: 'key',
    cell: ({ getValue }) => (
      <span className="font-mono text-sm font-medium text-foreground">
        {getValue() as string}
      </span>
    ),
  },
  {
    header: 'Module',
    accessorKey: 'module',
    cell: ({ getValue }) => {
      const module = getValue() as string;
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {module}
        </span>
      )
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
  },
  {
    header: 'English Value',
    accessorKey: 'englishValue',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <ExpandableText text={value} wordLimit={15} className="max-w-[300px]" />
    },
  },
  {
    header: 'Bangla Value',
    accessorKey: 'banglaValue',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <ExpandableText text={value} wordLimit={15} className="max-w-[300px]" />
    },
  },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    header: 'Updated At',
    accessorKey: 'updatedAt',
    cell: ({ getValue }) => getValue() ? getCustomDateTime(getValue() as string, 'YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    header: 'Created By',
    accessorKey: 'createdByName',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return value || '-';
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
  },
  {
    header: 'Updated By',
    accessorKey: 'updatedByName',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return value || '-';
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
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

  const fetchDetailRef = useRef(fetchDetail)
  fetchDetailRef.current = fetchDetail

  const hasFetchedRef = useRef(false)
  const prevFiltersRef = useRef<Record<string, any>>({})

  const [visible, setVisible] = useState<ColumnDef<ITranslation>[]>([])
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [showAddButton, setShowAddButton] = useState(false)
  const [view, setView] = useState<TranslationView>(readView)
  const [modules, setModules] = useState<string[]>([])

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Bulk operations state
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
    setData,
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
    minLoadingTime: 300
  })

  /* ---------------- Delete Handler ---------------- */
  const confirmSoftDelete = useCallback((id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }, [])

  const handleSoftDelete = useCallback(async () => {
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

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false)
    setDeleteId(null)
  }, [])

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
    confirmSoftDelete,
    showDetail,
    showEdit,
    showDelete
  }), [pageIndex, pageSize, fetchDetail, handleEditClick, confirmSoftDelete, showDetail, showEdit, showDelete])

  const allColumns = useMemo(() => [selectColumn, ...dataColumns], [selectColumn, dataColumns])
  const allColumnsRef = useRef(allColumns)
  allColumnsRef.current = allColumns

  /* ---------------- Inline edit (editor view) ---------------- */
  const handleInlineSave = useCallback(
    async (row: ITranslation, field: 'englishValue' | 'banglaValue', value: string) => {
      try {
        await updateTranslation(Number(row.id), {
          key: row.key,
          module: row.module,
          englishValue: field === 'englishValue' ? value : row.englishValue,
          banglaValue: field === 'banglaValue' ? value : row.banglaValue,
        })
        setData(prev => prev.map(r => (r.id === row.id ? { ...r, [field]: value, updatedAt: new Date().toISOString() } : r)))
        // Pick up the new text in the app itself.
        refreshTranslations()
      } catch (error) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        dispatchShowToast({ type: 'danger', message: message || 'Failed to save translation' })
        throw error
      }
    },
    [setData, refreshTranslations]
  )

  const changeView = (next: TranslationView) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      /* private mode: kept for this visit only */
    }
  }

  const toggleRow = useCallback((id: string) => {
    setSelectedRowIds(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else if (isValidId(id)) next[id] = true
      return next
    })
  }, [])

  /* ---------------- Modules for the quick filter ---------------- */
  useEffect(() => {
    let mounted = true
    getTranslationModules()
      .then(list => {
        if (!mounted || !Array.isArray(list)) return
        const names = list
          .map((m: unknown) => (typeof m === 'string' ? m : (m as { value?: string })?.value))
          .filter((m): m is string => !!m)
        setModules(Array.from(new Set(names)).sort())
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const activeModule: string | null =
    Array.isArray(filters.modules) && filters.modules.length === 1 ? filters.modules[0] : null
  const moduleFilterIsQuick = !filters.modules?.length || activeModule !== null

  const pickModule = (module: string | null) => {
    setPageIndex(0)
    setFilters(prev => ({ ...prev, modules: module ? [module] : [] }))
  }

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
    
  }, [filters, fetchData])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
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
    <div className="space-y-3">
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

      {/* Module chips and the view switch */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Module" className="flex min-w-0 flex-wrap gap-1.5">
          {[null, ...modules].map(m => {
            const active = moduleFilterIsQuick && activeModule === m
            return (
              <button
                key={m ?? '__all'}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pickModule(m)}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {m ?? 'All modules'}
              </button>
            )
          })}
        </div>
        <div role="radiogroup" aria-label="View" className="flex rounded-lg border border-border bg-muted/50 p-0.5">
          {([
            ['editor', Languages, 'Editor'],
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

      {/* EDITOR */}
      {view === 'editor' && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {showErrorState ? (
            <ErrorState
              message="Couldn't load translations"
              suggestion="The server didn't respond as expected. Check your connection and try again."
              onRetry={() => fetchData()}
            />
          ) : showEmptyState ? (
            <EmptyState message="No translations found" suggestion="Try another module, search or filter." />
          ) : data.length === 0 ? (
            <EditorSkeleton />
          ) : (
            <div className={cn('max-h-[680px] overflow-y-auto transition-opacity duration-200', loading && 'opacity-60')} aria-busy={loading}>
              <TranslationEditorList
                rows={data}
                canEdit={showEdit}
                canDelete={showDelete}
                selected={selectedRowIds}
                onToggle={toggleRow}
                onSave={handleInlineSave}
                onDetail={fetchDetail}
                onEdit={handleEditClick}
                onDelete={confirmSoftDelete}
              />
            </div>
          )}
        </div>
      )}

      {/* TABLE: stays in the page in editor view, hidden, so Print still has it. */}
      <div className={cn('relative rounded-xl overflow-hidden border border-border bg-card shadow-xs', view !== 'table' && 'hidden')}>
        <TableWithLoader loading={loading} id="printable-translation-table" containerClassName="max-h-[600px] min-h-[200px] overflow-auto relative">
          {showErrorState ? (
            <ErrorState
              message="Couldn't load translations"
              suggestion="The server didn't respond as expected. Check your connection and try again."
              onRetry={() => fetchData()}
            />
          ) : showEmptyState ? (
            <EmptyState
              message="No translations found"
              suggestion="Try adjusting your search or filter criteria to see more results."
            />
          ) : (
            <table className="w-full text-left border-collapse">
              {/* THEAD - Sticky */}
              <thead className="sticky top-0 z-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-border bg-muted">
                    {headerGroup.headers.map((header) => {
                      const isSortable = header.column.getCanSort()

                      return (
                        <th
                          key={header.id}
                          className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap ${header.column.columnDef.meta?.customClassName || ''}`}
                          style={{
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
                            <span className="flex-1 text-center">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {isSortable && (
                              <span className="relative">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <FaSortUp className="text-primary" size={12} />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <FaSortDown className="text-primary" size={12} />
                                ) : (
                                  <FaSort className="text-muted-foreground/50" size={10} />
                                )}
                                {header.column.id === 'select' && header.column.getIsSorted() && (
                                  <span className="absolute -top-1 -right-2 text-xs text-primary" title="Frontend sorting (no API call)">
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

              {/* TBODY */}
              <tbody>
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors duration-150",
                      "border-b border-border",
                      index !== table.getRowModel().rows.length - 1 && "border-b",
                      row.getIsSelected() && "bg-primary/10",
                      !row.getIsSelected() && "hover:bg-muted/50"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`px-4 py-3 text-sm text-foreground/90 ${cell.column.columnDef.meta?.tdClassName || ''}`}
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

              {/* TFOOT */}
              {data.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="border-t border-border">
                    <td
                      colSpan={visible.length}
                      className="p-4 text-sm text-muted-foreground text-center font-medium bg-muted"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Globe className="w-4 h-4" />
                        Showing {data.length} of {totalCount} translation entries
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
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
          setPageSize={handlePageSizeChange}
        />
      )}

      {/* Translation Detail Modal */}
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

      {/* Column Manager */}
      {showColumnModal && (
        <ColumnVisibilityManager<ITranslation>
          tableId="translationTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      {/* Filter Modal */}
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

      {/* Add Translation Sheet */}
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

      {/* Delete Confirmation Dialog */}
      {showDelete && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onCancel={cancelDelete}
          onConfirm={handleSoftDelete}
          title="Delete Translation"
          variant="warning"
          icon={<Trash2 className="w-6 h-6" />}
          confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
          loading={deleteLoading}
        >
          <div className="space-y-3">
            <p className="font-medium text-foreground">
              Are you sure you want to delete this translation?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The translation will be permanently removed.
            </p>
          </div>
        </ConfirmDialog>
      )}

      {/* Bulk Delete Confirmation Dialog */}
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
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <AlertTriangle className="size-5 text-destructive" />
            <p className="text-sm font-semibold text-destructive">
              Warning: This action cannot be undone!
            </p>
          </div>
          <p className="text-foreground/80">
            Are you sure you want to delete {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected translation(s)?
          </p>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all selected translations and their associated values.
          </p>
        </div>
      </ConfirmDialog>

      {/* Edit Translation Sheet */}
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
    </div>
  )
}