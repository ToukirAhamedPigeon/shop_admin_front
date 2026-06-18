// src/modules/backup/components/BackupList.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Download, Trash2, RotateCcw, RefreshCw, Cloud, HardDrive, Server, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { dispatchShowToast } from '@/lib/dispatch';
import { getBackups, deleteBackup, downloadBackup, restoreBackup, cleanOldBackups } from '../api';
import type { Backup, BackupFilterRequest } from '../types';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import Loader from '@/components/custom/Loader';
import { formatFileSize } from '@/lib/helpers';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppSelector } from '@/hooks/useRedux';

interface BackupListProps {
  isMobile?: boolean;
  onRefresh: () => void;
  refreshKey: number;
}

const ITEMS_PER_PAGE = 20;

const getStorageIcon = (type: string) => {
  switch (type) {
    case 'Local': return <HardDrive className="w-4 h-4 text-blue-500" />;
    case 'RemoteServer': return <Server className="w-4 h-4 text-purple-500" />;
    case 'GoogleDrive': return <Cloud className="w-4 h-4 text-green-500" />;
    default: return <HardDrive className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Success': return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Success</span>;
    case 'Failed': return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Failed</span>;
    case 'InProgress': return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">In Progress</span>;
    default: return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">{status}</span>;
  }
};

export default function BackupList({ isMobile = false, onRefresh, refreshKey }: BackupListProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
  const debouncedSearch = useDebounce(searchValue, 500);
  const isInitialMount = useRef(true);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const request: BackupFilterRequest = {
        page,
        limit: ITEMS_PER_PAGE,
        q: debouncedSearch || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const response = await getBackups(request);
      setBackups(response.data.backups);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Failed to load backups:', error);
      dispatchShowToast({ type: 'danger', message: 'Failed to load backups' });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadBackups();
    } else {
      loadBackups();
    }
  }, [loadBackups, refreshKey]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteBackup(deleteId);
      dispatchShowToast({ type: 'success', message: 'Backup deleted successfully' });
      setDeleteDialogOpen(false);
      setDeleteId(null);
      loadBackups();
      onRefresh();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to delete backup' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreId) return;
    setRestoreLoading(true);
    try {
      await restoreBackup(restoreId);
      dispatchShowToast({ type: 'success', message: 'Backup restored successfully' });
      setRestoreDialogOpen(false);
      setRestoreId(null);
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to restore backup' });
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await downloadBackup(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const backup = backups.find(b => b.id === id);
      link.setAttribute('download', backup?.fileName || 'backup.sql');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to download backup' });
    }
  };

  const handleCleanup = async () => {
    setCleanupLoading(true);
    try {
      await cleanOldBackups(7);
      dispatchShowToast({ type: 'success', message: 'Old backups cleaned up successfully' });
      setCleanupDialogOpen(false);
      loadBackups();
      onRefresh();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to cleanup backups' });
    } finally {
      setCleanupLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading && backups.length === 0) {
    return (
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200/30 dark:border-gray-700/30 flex items-center justify-center"
        style={{
          background: isDarkMode ? 'rgba(17,24,39,0.4)' : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
        }}>
        <Loader type="circular" size={isMobile ? 32 : 48} />
      </div>
    );
  }

  return (
    <div 
      className="flex-1 rounded-xl overflow-hidden flex flex-col relative"
      style={{
        background: isDarkMode ? 'rgba(17,24,39,0.4)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}`,
        boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      {/* Header */}
      <div className="relative z-10 p-2 sm:p-4 border-b border-gray-200/30 dark:border-gray-700/30 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1 group">
            <Input
              placeholder="Search backups..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={cn(
                "w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-0 group-focus-within:border-transparent",
                isMobile ? "pl-8 text-sm h-9" : "pl-10 h-10"
              )}
            />
            <div className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 opacity-0 group-focus-within:opacity-100"
              style={{
                background: isDarkMode ? 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                padding: '2px',
                borderRadius: '0.75rem',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
          </div>
          <Button 
            size={isMobile ? "sm" : "sm"}
            onClick={() => setCleanupDialogOpen(true)}
            className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
          >
            <Trash2 className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-0.5" : "mr-1")} />
            {!isMobile && "Cleanup Old"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative" style={{ maxHeight: '100%', minHeight: '400px' }}>
        {loading && backups.length > 0 && (
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 flex items-center justify-center">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
              <Loader type="bars" size={32} />
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse text-sm sm:text-base">
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="p-2 sm:p-4 font-semibold text-gray-700 dark:text-gray-200" style={{
                  background: isDarkMode ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                  backdropFilter: 'blur(8px)',
                }}>Name</th>
                <th className="p-2 sm:p-4 text-center font-semibold text-gray-700 dark:text-gray-200" style={{
                  background: isDarkMode ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                  backdropFilter: 'blur(8px)',
                }}>Storage</th>
                <th className="p-2 sm:p-4 text-center font-semibold text-gray-700 dark:text-gray-200" style={{
                  background: isDarkMode ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                  backdropFilter: 'blur(8px)',
                }}>Size</th>
                <th className="p-2 sm:p-4 text-center font-semibold text-gray-700 dark:text-gray-200" style={{
                  background: isDarkMode ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                  backdropFilter: 'blur(8px)',
                }}>Status</th>
                <th className="p-2 sm:p-4 text-center font-semibold text-gray-700 dark:text-gray-200" style={{
                  background: isDarkMode ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                  backdropFilter: 'blur(8px)',
                }}>Created At</th>
                <th className="p-2 sm:p-4 text-center font-semibold text-gray-700 dark:text-gray-200 w-32" style={{
                  background: isDarkMode ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                  backdropFilter: 'blur(8px)',
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr className="border-b border-gray-200/40 dark:border-gray-700/30">
                  <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400 py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HardDrive className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm sm:text-base">No backups found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                backups.map((backup, index) => (
                  <tr 
                    key={backup.id}
                    className={cn(
                      "transition-all duration-200",
                      "border-b border-gray-200/40 dark:border-gray-700/30",
                      index !== backups.length - 1 && "border-b",
                      "hover:bg-white/20 dark:hover:bg-white/5"
                    )}
                  >
                    <td className="p-2 sm:p-4 text-gray-700 dark:text-gray-300">
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[150px]">{backup.fileName}</p>
                      </div>
                    </td>
                    <td className="p-2 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStorageIcon(backup.storageType)}
                        <span className="text-xs text-gray-500">{backup.storageType}</span>
                      </div>
                    </td>
                    <td className="p-2 sm:p-4 text-center text-gray-700 dark:text-gray-300">
                      {formatFileSize(backup.fileSize)}
                    </td>
                    <td className="p-2 sm:p-4 text-center">
                      {getStatusBadge(backup.status)}
                    </td>
                    <td className="p-2 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
                      {format(new Date(backup.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="p-2 sm:p-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleDownload(backup.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer group"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            setRestoreId(backup.id);
                            setRestoreDialogOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors cursor-pointer group"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4 text-green-500 group-hover:text-green-600" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(backup.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors cursor-pointer group"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="relative z-10 p-2 sm:p-4 border-t border-gray-200/30 dark:border-gray-700/30 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg">
              {isMobile 
                ? `${((page - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(page * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
                : `Showing ${((page - 1) * ITEMS_PER_PAGE) + 1} - ${Math.min(page * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
              }
            </span>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className={isMobile ? "hidden" : "inline ml-1"}>Previous</span>
              </Button>
              <span className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg font-medium min-w-[40px] text-center">
                {isMobile ? `${page}/${totalPages}` : `${page} / ${totalPages}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
              >
                <span className={isMobile ? "hidden" : "inline mr-1"}>Next</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Backup"
        variant="destructive"
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
        loading={deleteLoading}
      >
        <p>Are you sure you want to delete this backup? This action cannot be undone.</p>
      </ConfirmDialog>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        open={restoreDialogOpen}
        onCancel={() => setRestoreDialogOpen(false)}
        onConfirm={handleRestore}
        title="Restore Backup"
        variant="warning"
        confirmLabel={restoreLoading ? 'Restoring...' : 'Restore'}
        loading={restoreLoading}
      >
        <div className="space-y-2">
          <p className="text-yellow-600 dark:text-yellow-400 font-medium">Are you sure you want to restore this backup?</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">This will replace the current database with the backup data.</p>
        </div>
      </ConfirmDialog>

      {/* Cleanup Confirmation Dialog */}
      <ConfirmDialog
        open={cleanupDialogOpen}
        onCancel={() => setCleanupDialogOpen(false)}
        onConfirm={handleCleanup}
        title="Cleanup Old Backups"
        variant="destructive"
        confirmLabel={cleanupLoading ? 'Cleaning...' : 'Cleanup'}
        loading={cleanupLoading}
      >
        <div className="space-y-2">
          <p className="text-red-600 dark:text-red-400 font-medium">Delete backups older than 7 days?</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone. All backups older than 7 days will be permanently deleted.</p>
        </div>
      </ConfirmDialog>
    </div>
  );
}