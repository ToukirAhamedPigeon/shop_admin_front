// app/(dashboard)/admin/options/Options.tsx

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
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
  TrashViewIndicator,
  TableWithLoader,
  SelectAllCheckbox
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
import { deleteOption, restoreOption, getOptions, bulkDeleteOptions, bulkRestoreOptions, getOptionDeleteInfo } from '../api';
import { AlertTriangle, Archive, FileWarning, Info, RotateCcw, Trash2, Database, XCircle, List, AlertCircle } from 'lucide-react';
import { dispatchShowToast } from '@/lib/dispatch';
import { cn } from '@/lib/utils';

interface DeleteInfoResponse {
  canBePermanent: boolean;
  message: string;
  hasChildren: boolean;
  childrenCount: number;
}

interface BulkError {
  id: string;
  error: string;
}

interface BulkOperationResponse {
  success: boolean;
  message: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  errors: BulkError[];
}

// Helper function to validate ID
const isValidId = (id: string): boolean => {
  return Boolean(id && id.length > 0 && id !== '0');
};

/* ---------------------------------- */
/* Select Column with Frontend Sorting */
/* ---------------------------------- */
const getSelectColumn = (): ColumnDef<IOption> => ({
  id: 'select',
  accessorFn: (row) => row.id,
  header: ({ table }) => <SelectAllCheckbox<IOption> table={table} />,
  cell: ({ row }) => {
    const isSelected = row.getIsSelected();
    
    return (
      <div className="flex justify-center">
        <div 
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleSelected(!isSelected);
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
    );
  },
  enableSorting: true,
  sortingFn: (rowA, rowB) => {
    const isSelectedA = rowA.getIsSelected();
    const isSelectedB = rowB.getIsSelected();
    if (isSelectedA === isSelectedB) return 0;
    return isSelectedA ? -1 : 1;
  },
  sortDescFirst: false,
  meta: { customClassName: 'text-center', tdClassName: 'text-center' },
});

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
          deletePermissions={['delete-admin-options']}
          restorePermissions={['update-admin-options']}
          permanentDeletePermissions={['delete-admin-options']}
        />
      );
    },
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: false,
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
    meta: { customClassName: 'text-center', tdClassName: 'text-center' },
    enableSorting: false,
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

  const {
    isModalOpen,
    selectedItem,
    fetchDetail,
    closeModal,
    detailLoading
  } = useDetailModal<IOption>('/options');

  const fetchDetailRef = useRef(fetchDetail);
  fetchDetailRef.current = fetchDetail;

  const hasFetchedRef = useRef(false);
  const prevFiltersRef = useRef<Record<string, any>>({});

  const [visible, setVisible] = useState<ColumnDef<IOption>[]>([]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showAddButton, setShowAddButton] = useState(false);
  const [showTrashButton, setShowTrashButton] = useState(false);

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});

  // Delete dialogs state
  const [softDeleteDialogOpen, setSoftDeleteDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<DeleteInfoResponse | null>(null);
  const [checkingDelete, setCheckingDelete] = useState(false);

  // Bulk operations state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkRestoreDialogOpen, setBulkRestoreDialogOpen] = useState(false);
  const [bulkPermanentDeleteDialogOpen, setBulkPermanentDeleteDialogOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Bulk error details state
  const [bulkErrorDialogOpen, setBulkErrorDialogOpen] = useState(false);
  const [bulkErrors, setBulkErrors] = useState<BulkError[]>([]);
  const [bulkOperationType, setBulkOperationType] = useState<'delete' | 'restore' | 'permanent'>('delete');

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
        // Clear selection after data refresh
        setSelectedRowIds({});
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
        // Clear selection after data refresh
        setSelectedRowIds({});
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
      // Clear selection after data refresh
      setSelectedRowIds({});
    } catch (error: any) {
      console.error('Failed to restore option:', error);
      let errorMessage = error.response?.data?.message || "Failed to restore option";
      dispatchShowToast({ type: "danger", message: errorMessage });
    } finally {
      setRestoreLoading(false);
    }
  }, [restoreId, fetchData]);

  /* ---------------- Bulk Operations ---------------- */
  const getSelectedIds = useCallback(() => {
    return Object.keys(selectedRowIds).filter(id => selectedRowIds[id] && isValidId(id));
  }, [selectedRowIds]);

  const handleBulkDelete = useCallback(() => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) {
      dispatchShowToast({ type: "warning", message: "No options selected for deletion" });
      return;
    }
    setBulkDeleteDialogOpen(true);
  }, [getSelectedIds]);

  const handleBulkRestore = useCallback(() => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) {
      dispatchShowToast({ type: "warning", message: "No options selected for restore" });
      return;
    }
    setBulkRestoreDialogOpen(true);
  }, [getSelectedIds]);

  const handleBulkPermanentDelete = useCallback(() => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) {
      dispatchShowToast({ type: "warning", message: "No options selected for permanent deletion" });
      return;
    }
    setBulkPermanentDeleteDialogOpen(true);
  }, [getSelectedIds]);

  const executeBulkSoftDelete = useCallback(async () => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) return;
    
    setBulkLoading(true);
    try {
      const response = await bulkDeleteOptions(selectedIds, false) as BulkOperationResponse;
      
      if (response.success) {
        dispatchShowToast({ 
          type: "success", 
          message: response.message || `${response.successCount} option(s) moved to trash successfully` 
        });
        setBulkDeleteDialogOpen(false);
        setSelectedRowIds({});
        fetchData();
        
        // Show error details if there were failures
        if (response.failedCount > 0 && response.errors && response.errors.length > 0) {
          setBulkErrors(response.errors);
          setBulkOperationType('delete');
          setBulkErrorDialogOpen(true);
        }
      } else {
        throw new Error(response.message || "Failed to move options to trash");
      }
    } catch (error: any) {
      console.error('Bulk soft delete failed:', error);
      const errorResponse = error.response?.data;
      
      if (errorResponse?.errors && errorResponse.errors.length > 0) {
        setBulkErrors(errorResponse.errors);
        setBulkOperationType('delete');
        setBulkErrorDialogOpen(true);
        dispatchShowToast({ type: "danger", message: `Failed to delete ${errorResponse.failedCount} option(s). See details.` });
      } else {
        dispatchShowToast({ type: "danger", message: errorResponse?.message || "Failed to move options to trash" });
      }
    } finally {
      setBulkLoading(false);
    }
  }, [getSelectedIds, fetchData]);

  const executeBulkRestore = useCallback(async () => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) return;
    
    setBulkLoading(true);
    try {
      const response = await bulkRestoreOptions(selectedIds) as BulkOperationResponse;
      
      if (response.success) {
        dispatchShowToast({ 
          type: "success", 
          message: response.message || `${response.successCount} option(s) restored successfully` 
        });
        setBulkRestoreDialogOpen(false);
        setSelectedRowIds({});
        fetchData();
        
        // Show error details if there were failures
        if (response.failedCount > 0 && response.errors && response.errors.length > 0) {
          setBulkErrors(response.errors);
          setBulkOperationType('restore');
          setBulkErrorDialogOpen(true);
        }
      } else {
        throw new Error(response.message || "Failed to restore options");
      }
    } catch (error: any) {
      console.error('Bulk restore failed:', error);
      const errorResponse = error.response?.data;
      
      if (errorResponse?.errors && errorResponse.errors.length > 0) {
        setBulkErrors(errorResponse.errors);
        setBulkOperationType('restore');
        setBulkErrorDialogOpen(true);
        dispatchShowToast({ type: "danger", message: `Failed to restore ${errorResponse.failedCount} option(s). See details.` });
      } else {
        dispatchShowToast({ type: "danger", message: errorResponse?.message || "Failed to restore options" });
      }
    } finally {
      setBulkLoading(false);
    }
  }, [getSelectedIds, fetchData]);

  const executeBulkPermanentDelete = useCallback(async () => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) return;
    
    setBulkLoading(true);
    try {
      const response = await bulkDeleteOptions(selectedIds, true) as BulkOperationResponse;
      
      if (response.success) {
        dispatchShowToast({ 
          type: "success", 
          message: response.message || `${response.successCount} option(s) permanently deleted successfully` 
        });
        setBulkPermanentDeleteDialogOpen(false);
        setSelectedRowIds({});
        fetchData();
        
        // Show error details if there were failures
        if (response.failedCount > 0 && response.errors && response.errors.length > 0) {
          setBulkErrors(response.errors);
          setBulkOperationType('permanent');
          setBulkErrorDialogOpen(true);
        }
      } else {
        throw new Error(response.message || "Failed to permanently delete options");
      }
    } catch (error: any) {
      console.error('Bulk permanent delete failed:', error);
      const errorResponse = error.response?.data;
      
      if (errorResponse?.errors && errorResponse.errors.length > 0) {
        setBulkErrors(errorResponse.errors);
        setBulkOperationType('permanent');
        setBulkErrorDialogOpen(true);
        dispatchShowToast({ type: "danger", message: `Failed to delete ${errorResponse.failedCount} option(s). See details.` });
      } else {
        dispatchShowToast({ type: "danger", message: errorResponse?.message || "Failed to permanently delete options" });
      }
    } finally {
      setBulkLoading(false);
    }
  }, [getSelectedIds, fetchData]);

  /* ---------------- Stable Columns ---------------- */
  const selectColumn = useMemo(() => getSelectColumn(), []);
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
  }), [pageIndex, pageSize, fetchDetail, handleEditClick, confirmSoftDelete, confirmRestore, confirmPermanentDelete, showDetail, showEdit, showSoftDelete, showRestore, showPermanentDelete]);

  const allColumns = useMemo(() => [selectColumn, ...dataColumns], [selectColumn, dataColumns]);
  const allColumnsRef = useRef(allColumns);
  allColumnsRef.current = allColumns;

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
          allColumnsRef.current
        );

        if (mounted) {
          setVisible(visibleColumns.length ? visibleColumns : allColumnsRef.current);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadColumnSettings();

    return () => {
      mounted = false;
    };
  }, [userId]);

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
    
  }, [filters, fetchData]);

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
  const table = useReactTable<IOption>({
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
      let newSelection: Record<string, boolean>;
      
      if (typeof updater === 'function') {
        newSelection = updater(selectedRowIds);
      } else {
        newSelection = updater;
      }
      
      const filteredSelection = Object.keys(newSelection).reduce((acc, key) => {
        if (isValidId(key) && newSelection[key]) {
          acc[key] = newSelection[key];
        }
        return acc;
      }, {} as Record<string, boolean>);
      
      setSelectedRowIds(filteredSelection);
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      
      // Only fetch data if sorting by columns other than 'select'
      const isSelectColumnSort = newSorting.length > 0 && newSorting[0].id === 'select';
      if (!isSelectColumnSort) {
        fetchData();
      }
    },
    manualPagination: true,
    manualSorting: false,
    pageCount: Math.ceil(totalCount / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleResetSorting = useCallback(() => {
    setSorting([]);
  }, [setSorting]);

  /* ---------------- Empty State ---------------- */
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
              {showTrash ? "No deleted options found" : "No options found"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {showTrash 
                ? "Deleted options will appear here once you move them to trash." 
                : "Try adjusting your search or filter criteria to see more results."}
            </p>
          </div>
        ) : (
          <table className="table-auto w-full text-left border border-collapse">
            <thead className="sticky -top-1 z-10 bg-gray-200 dark:bg-gray-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort();
                    
                    return (
                      <th
                        key={header.id}
                        className={`p-2 border text-center ${header.column.columnDef.meta?.customClassName || ''}`}
                        onClick={(event) => {
                          if (isSortable) {
                            const handler = header.column.getToggleSortingHandler();
                            if (handler) handler(event);
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
                    );
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

      {/* Option Detail Modal */}
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

      {/* Column Manager */}
      {showColumnModal && (
        <ColumnVisibilityManager<IOption>
          tableId="optionTable"
          open={showColumnModal}
          onClose={() => setShowColumnModal(false)}
          initialColumns={allColumns}
          onChange={setVisible}
        />
      )}

      {/* Filter Modal */}
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

      {/* Add Option Sheet */}
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
            This option will be moved to trash. You can restore it later.
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

      {/* Restore Confirmation Dialog */}
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

      {/* Bulk Error Details Dialog */}
      <ConfirmDialog
        open={bulkErrorDialogOpen}
        onCancel={() => setBulkErrorDialogOpen(false)}
        onConfirm={() => setBulkErrorDialogOpen(false)}
        title={`Bulk ${bulkOperationType === 'delete' ? 'Delete' : bulkOperationType === 'restore' ? 'Restore' : 'Permanent Delete'} - Operation Details`}
        variant="warning"
        icon={<AlertCircle className="w-6 h-6" />}
        confirmLabel="Close"
        showCancelButton={false}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              {bulkErrors.length} operation(s) failed during this bulk operation.
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {bulkErrors.map((error, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                        ID: {error.id}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {error.error}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please review the failed items and try again after addressing the issues.
            </p>
          </div>
        </div>
      </ConfirmDialog>

      {/* Error Dialog - Cannot permanently delete due to children */}
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

      {/* Edit Option Sheet */}
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
            Are you sure you want to move {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected option(s) to trash?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These options can be restored later from the trash view.
          </p>
        </div>
      </ConfirmDialog>

      {/* Bulk Restore Confirmation Dialog */}
      <ConfirmDialog
        open={bulkRestoreDialogOpen}
        onCancel={() => setBulkRestoreDialogOpen(false)}
        onConfirm={executeBulkRestore}
        title="Bulk Restore Options"
        variant="success"
        icon={<RotateCcw className="w-6 h-6" />}
        confirmLabel={bulkLoading ? 'Restoring...' : 'Restore'}
        loading={bulkLoading}
      >
        <div className="space-y-3">
          <p className="text-green-600 dark:text-green-400 font-medium">
            Are you sure you want to restore {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected option(s)?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These options will be moved back to active options.
          </p>
        </div>
      </ConfirmDialog>

      {/* Bulk Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        open={bulkPermanentDeleteDialogOpen}
        onCancel={() => setBulkPermanentDeleteDialogOpen(false)}
        onConfirm={executeBulkPermanentDelete}
        title="Bulk Permanently Delete Options"
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
            Are you sure you want to permanently delete {Object.keys(selectedRowIds).filter(id => selectedRowIds[id]).length} selected option(s)?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will permanently delete all selected options and their associated data.
          </p>
        </div>
      </ConfirmDialog>
    </motion.div>
  );
}