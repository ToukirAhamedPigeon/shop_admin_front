// app/(dashboard)/admin/options/Options.tsx - Add permanent delete functionality

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

import { useTable } from '@/hooks/useTable';
import { useDetailModal } from '@/hooks/useDetailModal';
import {
  TableLoader,
  TableHeaderActions,
  TablePaginationFooter,
  RowActions,
  IndexCell,
  EmptyState,
  TrashViewIndicator,
  TableWithLoader
} from '@/components/custom/Table';
import Modal from '@/components/custom/Modal';
import { ColumnVisibilityManager } from '@/components/custom/ColumnVisibilityManager';
import { refreshColumnSettings } from '@/lib/refreshColumnSettings';
import { exportVisibleTableToExcel } from '@/lib/exportTable';
import { printTableById } from '@/lib/printTable';
import { getCustomDateTime } from '@/lib/formatDate';
import { ExpandableText } from '@/components/custom/ExpandableText';
import { FilterModal } from '@/components/custom/FilterModal';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

import OptionDetail from './OptionDetail';
import type { IOption } from '@/types/option';
import OptionFilterForm from './OptionFilterForm';
import { can } from '@/lib/authCheck';
import FormHolderSheet from '@/components/custom/FormHolderSheet';
import AddOption from './AddOption';
import EditOption from './EditOption';
import { useEditSheet } from '@/hooks/useEditSheet';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import { deleteOption, restoreOption, getOptions, getOptionDeleteInfo } from '../api';
import { AlertTriangle, Archive, FileWarning, Info, RotateCcw, Trash2, Database, XCircle } from 'lucide-react';
import { dispatchShowToast } from '@/lib/dispatch';

interface DeleteInfoResponse {
  canBePermanent: boolean;
  message: string;
  hasChildren: boolean;
  childrenCount: number;
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
  pageIndex: number;
  pageSize: number;
  fetchDetail: (item: IOption) => void;
  handleEditClick: (item: IOption) => void;
  confirmSoftDelete: (id: string) => void;
  confirmRestore: (id: string) => void;
  confirmPermanentDelete: (id: string) => void;
  showDetail?: boolean;
  showEdit?: boolean;
  showSoftDelete?: boolean;
  showRestore?: boolean;
  showPermanentDelete?: boolean;
}): ColumnDef<IOption>[] => [
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
          deletePermissions={['delete-admin-options']}
          restorePermissions={['update-admin-options']}
          permanentDeletePermissions={['delete-admin-options']}
        />
      );
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>
  },
  {
    header: 'Parent',
    accessorKey: 'parentName',
    cell: ({ getValue }) => {
      const parentName = getValue() as string;
      return parentName || <span className="text-gray-400">-</span>;
    }
  },
  {
    header: 'Has Child',
    accessorKey: 'hasChild',
    cell: ({ getValue }) => getValue() ? 'Yes' : 'No',
    meta: { customClassName: 'text-center', tdClassName: 'text-center' }
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
  {
    header: 'Created By',
    accessorKey: 'createdByName',
    cell: ({ getValue }) => (getValue() as string) || '-'
  },
];

/* ---------------------------------- */
/* Options Component */
/* ---------------------------------- */
export default function Options() {
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '');
  const currentUserRoles = useSelector((s: RootState) => s.auth.user?.roles || []);
  const isDeveloper = currentUserRoles.includes('Developer');

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading
  } = useDetailModal<IOption>('/options');

  const [visible, setVisible] = useState<ColumnDef<IOption>[]>([]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showAddButton, setShowAddButton] = useState(false);
  const [showTrashButton, setShowTrashButton] = useState(false);

  // Delete dialogs state
  const [softDeleteDialogOpen, setSoftDeleteDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<DeleteInfoResponse | null>(null);
  const [checkingDelete, setCheckingDelete] = useState(false);

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ 
    message: string; 
    childrenCount?: number 
  } | null>(null);

  // Restore dialog state
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const showDetail = true;
  const showEdit = can(['update-admin-options']);
  const showSoftDelete = can(['delete-admin-options']);
  const showRestore = can(['update-admin-options']);
  const showPermanentDelete = can(['delete-admin-options']);

  const {
    isOpen: isEditSheetOpen,
    itemToEdit: optionToEdit,
    openEdit: handleEditClick,
    closeEdit: closeEditSheet
  } = useEditSheet<IOption>();

  const hasFetchedRef = useRef(false);
  const prevFiltersRef = useRef<Record<string, any>>({});

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
      q?: string;
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: string;
      showTrash?: boolean;
    }): Promise<{
      data: IOption[];
      total: number;
      grandTotalCount: number;
    }> => {
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if ((key === 'createdFrom' || key === 'createdTo') && value === '') {
          acc[key] = null;
        } else if (key === 'parentId') {
          if (value === 'all') {
            // Skip
          } else if (value === null) {
            acc[key] = null;
          } else {
            acc[key] = value;
          }
        } else if (Array.isArray(value) && value.length === 0) {
          // Skip
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const finalFilters = {
        ...cleanFilters,
        isDeletedStr: showTrash ? 'true' : 'false'
      };

      const res = await getOptions({
        q,
        page,
        limit,
        sortBy,
        sortOrder,
        ...finalFilters
      });

      return {
        data: res.options as IOption[],
        total: res.totalCount,
        grandTotalCount: res.grandTotalCount
      };
    },
    [filters]
);

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
  } = useTable<IOption>({
    fetcher: stableFetcher,
    defaultSort: 'createdAt',
    enableTrashView: true,
    minLoadingTime: 1000
  });

  /* ---------------- Sync isDeletedStr with showTrash ---------------- */
  useEffect(() => {
    const newIsDeletedStr = showTrash ? 'true' : 'false';
    if (filters.isDeletedStr !== newIsDeletedStr) {
      setFilters(prev => ({
        ...prev,
        isDeletedStr: newIsDeletedStr
      }));
    }
  }, [showTrash]);

  /* ---------------- Delete Eligibility Check ---------------- */
  const checkDeleteEligibility = useCallback(async (id: string): Promise<boolean> => {
    setCheckingDelete(true);
    try {
      const info = await getOptionDeleteInfo(id);
      setDeleteInfo(info);
      return info.canBePermanent;
    } catch (error) {
      console.error('Failed to get delete info:', error);
      setDeleteInfo({
        canBePermanent: false,
        message: 'Failed to check delete eligibility',
        hasChildren: false,
        childrenCount: 0
      });
      return false;
    } finally {
      setCheckingDelete(false);
    }
  }, []);

  const confirmSoftDelete = useCallback(async (id: string) => {
    setDeleteId(id);
    await checkDeleteEligibility(id);
    setSoftDeleteDialogOpen(true);
  }, [checkDeleteEligibility]);

  const confirmRestore = useCallback((id: string) => {
    setRestoreId(id);
    setRestoreDialogOpen(true);
  }, []);

  const confirmPermanentDelete = useCallback(async (id: string) => {
    setDeleteId(id);
    const canBePermanent = await checkDeleteEligibility(id);
    if (canBePermanent) {
      setPermanentDeleteDialogOpen(true);
    } else {
      setErrorDetails({
        message: deleteInfo?.message || 'Cannot permanently delete this option',
        childrenCount: deleteInfo?.childrenCount
      });
      setErrorDialogOpen(true);
    }
  }, [checkDeleteEligibility, deleteInfo]);

  const handleSoftDelete = useCallback(async () => {
    if (!deleteId) return;
    
    setDeleteLoading(true);
    try {
      const response = await deleteOption(deleteId, false);
      
      if (response.status === 200) {
        dispatchShowToast({ 
          type: "success", 
          message: response.data?.message || "Option moved to trash successfully" 
        });
        setSoftDeleteDialogOpen(false);
        setDeleteId(null);
        fetchData();
      } else {
        throw new Error(response.data?.message || "Failed to move option to trash");
      }
    } catch (error: any) {
      console.error('Soft delete failed:', error);
      let errorMessage = error.response?.data?.message || error.message || "Failed to move option to trash";
      dispatchShowToast({ type: "danger", message: errorMessage });
      setSoftDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, fetchData]);

  const handlePermanentDelete = useCallback(async () => {
    if (!deleteId) return;
    
    setDeleteLoading(true);
    try {
      const response = await deleteOption(deleteId, true);
      
      if (response.status === 200 && response.data) {
        dispatchShowToast({ 
          type: "success", 
          message: response.data.message || "Option permanently deleted successfully" 
        });
        setPermanentDeleteDialogOpen(false);
        setSoftDeleteDialogOpen(false);
        setDeleteId(null);
        fetchData();
      } else {
        throw new Error(response.data?.message || "Failed to delete option");
      }
    } catch (error: any) {
      console.error('Permanent delete failed:', error);
      let errorMessage = error.response?.data?.message || error.message || "Failed to permanently delete option";
      dispatchShowToast({ type: "danger", message: errorMessage });
      setPermanentDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, fetchData]);

  const cancelDelete = useCallback(() => {
    setSoftDeleteDialogOpen(false);
    setPermanentDeleteDialogOpen(false);
    setDeleteId(null);
    setDeleteInfo(null);
    setErrorDetails(null);
  }, []);

  const cancelRestore = useCallback(() => {
    setRestoreDialogOpen(false);
    setRestoreId(null);
  }, []);

  const handleRestore = useCallback(async () => {
    if (!restoreId) return;
    
    setRestoreLoading(true);
    try {
      await restoreOption(restoreId);
      dispatchShowToast({ type: "success", message: "Option restored successfully" });
      setRestoreDialogOpen(false);
      setRestoreId(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to restore option:', error);
      let errorMessage = error.response?.data?.message || "Failed to restore option";
      dispatchShowToast({ type: "danger", message: errorMessage });
    } finally {
      setRestoreLoading(false);
    }
  }, [restoreId, fetchData]);

  /* ---------------- Stable Columns ---------------- */
  const allColumnsRef = useRef<ColumnDef<IOption>[]>([]);

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
    });
  }

  const allColumns = allColumnsRef.current;

  /* ---------------- Add Button Permission ---------------- */
  useEffect(() => {
    setShowAddButton(can(['create-admin-options']));
    setShowTrashButton(can(['update-admin-options']));
  }, []);

  /* ---------------- Load Column Settings ---------------- */
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const loadColumnSettings = async () => {
      try {
        const { visibleColumns } = await refreshColumnSettings<IOption>(
          'optionTable',
          userId,
          allColumns
        );

        if (mounted) {
          setVisible(visibleColumns.length ? visibleColumns : allColumns);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadColumnSettings();

    return () => {
      mounted = false;
    };
  }, [userId, allColumns]);

  /* ---------------- Initial Fetch ---------------- */
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchData();
      hasFetchedRef.current = true;
    }
  }, [fetchData]);

  /* ---------------- Filters Fetch ---------------- */
  useEffect(() => {
    if (!hasFetchedRef.current) return;
    
    if (JSON.stringify(prevFiltersRef.current) === JSON.stringify(filters)) {
      return;
    }
    setPageIndex(0);
    fetchData();
    prevFiltersRef.current = filters;
    
  }, [filters, fetchData, setPageIndex]);

  /* ---------------- Visible Column IDs ---------------- */
  const visibleIds = useMemo(
    () => visible.map(c => c.id ?? ((c as any).accessorKey ?? '')),
    [visible]
  );

  const isFilterActive = useMemo(
    () =>
      Object.values(filters).some(
        v => v && (Array.isArray(v) ? v.length > 0 : true)
      ),
    [filters]
  );

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
  });

  const showEmptyState = !loading && !error && data.length === 0;
  const showErrorState = !loading && error;

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
        onPrint={() => printTableById('printable-option-table', 'Options')}
        onExport={() =>
          exportVisibleTableToExcel({
            data,
            columns: allColumns,
            visibleColumnIds: visibleIds,
            fileName: 'Options'
          })
        }
        onFilter={() => setFilterModalOpen(true)}
        isFilterActive={isFilterActive}
      />
      
      {/* TABLE */}
      <TableWithLoader loading={loading} id="printable-option-table">
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

      {/* OPTION DETAIL */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Option Details"
        widthPercent={60}
      >
        {detailLoading || !selectedItem ? (
          <TableLoader loading />
        ) : (
          <OptionDetail option={selectedItem} />
        )}
      </Modal>

      {/* COLUMN MANAGER */}
      {showColumnModal && (
        <ColumnVisibilityManager<IOption>
          tableId="optionTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      {/* FILTER MODAL */}
      <FilterModal
        tableId="optionTable"
        title="Filter Options"
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={newFilters => {
          const cleanedFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
            if ((key === 'createdFrom' || key === 'createdTo') && value === '') {
              acc[key] = null;
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as Record<string, any>);
          
          setPageIndex(0);
          setFilters(cleanedFilters);
          setFilterModalOpen(false);
        }}
        initialFilters={filters}
        renderForm={(filterValues, setFilterValues, resetRef) => (
          <OptionFilterForm
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

      {/* ADD OPTION */}
      {showAddButton && (
        <FormHolderSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          title="Add New Option"
          titleDivClassName="success-gradient"
        >
          <AddOption fetchData={fetchData} onClose={() => setIsSheetOpen(false)} />
        </FormHolderSheet>
      )}

      {/* SOFT DELETE CONFIRMATION DIALOG */}
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
            This option will be moved to trash. You can restore it later.
          </p>
          {deleteInfo?.message && deleteInfo.canBePermanent === false && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{deleteInfo.message}</p>
            </div>
          )}
        </div>
      </ConfirmDialog>

      {/* PERMANENT DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={permanentDeleteDialogOpen}
        onCancel={cancelDelete}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Option"
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
            This will permanently delete this option.
          </p>
          
          {deleteInfo?.hasChildren && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Note: This option has {deleteInfo.childrenCount} child option(s). They will be updated to remove parent reference.
              </p>
            </div>
          )}
        </div>
      </ConfirmDialog>

      {/* RESTORE CONFIRMATION DIALOG */}
      {showRestore && (
        <ConfirmDialog
          open={restoreDialogOpen}
          onCancel={cancelRestore}
          onConfirm={handleRestore}
          title="Restore Option"
          variant="success"
          icon={<RotateCcw className="w-6 h-6" />}
          confirmLabel={restoreLoading ? 'Restoring...' : 'Restore'}
          loading={restoreLoading}
        >
          <div className="space-y-3">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Are you sure you want to restore this option?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The option will be moved back to active options.
            </p>
          </div>
        </ConfirmDialog>
      )}

      {/* ERROR DIALOG - Cannot permanently delete due to children */}
      <ConfirmDialog
        open={errorDialogOpen}
        onCancel={() => setErrorDialogOpen(false)}
        onConfirm={() => setErrorDialogOpen(false)}
        title="Cannot Delete Option"
        variant="destructive"
        icon={<XCircle className="w-6 h-6" />}
        confirmLabel="OK"
        showCancelButton={false}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <Database className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">
              {errorDetails?.message || "This option has child options and cannot be permanently deleted"}
            </p>
          </div>
          
          {errorDetails?.childrenCount && errorDetails.childrenCount > 0 && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This option has {errorDetails.childrenCount} child option(s). Please soft delete it instead.
              </p>
            </div>
          )}
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please move this option to trash instead.
            </p>
          </div>
        </div>
      </ConfirmDialog>

      {/* EDIT OPTION */}
      {showEdit && (
        <FormHolderSheet
          open={isEditSheetOpen}
          onOpenChange={closeEditSheet}
          title="Edit Option"
          titleDivClassName="warning-gradient"
        >
          {optionToEdit && (
            <EditOption
              optionId={optionToEdit.id}
              onClose={closeEditSheet}
              fetchData={fetchData}
            />
          )}
        </FormHolderSheet>
      )}
    </motion.div>
  );
}