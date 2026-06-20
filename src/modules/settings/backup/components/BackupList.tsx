// src/modules/backup/components/BackupList.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { 
  Download, Trash2, RotateCcw, Cloud, HardDrive, Server, 
  ChevronLeft, ChevronRight, Filter, X,  
  Database, Grid3x3, 
  List, CheckSquare, Square, Trash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dispatchShowToast } from '@/lib/dispatch';
import { getBackups, deleteBackup, downloadBackup, restoreBackup, cleanOldBackups, bulkDeleteBackups } from '../api';
import type { Backup, BackupFilterRequest } from '../types';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import Loader from '@/components/custom/Loader';
import { formatFileSize } from '@/lib/helpers';
import { useAppSelector } from '@/hooks/useRedux';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import GlassCard from '@/components/custom/GlassCard';
import DateTimeInput from '@/components/custom/FormInputs';
import { Checkbox } from '@/components/ui/checkbox';

interface BackupListProps {
  isMobile?: boolean;
  onRefresh: () => void;
  refreshKey: number;
}

const ITEMS_PER_PAGE = 12;

type ViewMode = 'grid' | 'list';

const getStorageIcon = (type: string) => {
  switch (type) {
    case 'Local': return <HardDrive className="w-5 h-5 text-blue-500" />;
    case 'RemoteServer': return <Server className="w-5 h-5 text-purple-500" />;
    case 'GoogleDrive': return <Cloud className="w-5 h-5 text-green-500" />;
    default: return <HardDrive className="w-5 h-5 text-gray-500" />;
  }
};

const getStorageColor = (type: string) => {
  switch (type) {
    case 'Local': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'RemoteServer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'GoogleDrive': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Success': 
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">Success</Badge>;
    case 'Failed': 
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0">Failed</Badge>;
    case 'InProgress': 
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">In Progress</Badge>;
    default: 
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 border-0">{status}</Badge>;
  }
};

const getBackupType = (name: string) => {
  if (name.includes('manual')) return 'manual';
  if (name.includes('auto')) return 'auto';
  return 'manual';
};

export default function BackupList({ isMobile = false, onRefresh, refreshKey }: BackupListProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
  // Filter states
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [backupType, setBackupType] = useState<string>('all');
  const [storageType, setStorageType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const isInitialMount = useRef(true);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    try {
      const request: BackupFilterRequest = {
        page,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      
      if (fromDate) {
        request.fromDate = fromDate.toISOString();
      }
      if (toDate) {
        request.toDate = toDate.toISOString();
      }
      
      if (backupType !== 'all') {
        request.q = backupType;
      }
      
      if (storageType !== 'all') {
        request.storageType = storageType;
      }
      
      const response = await getBackups(request);
      setBackups(response.data.backups);
      setTotalCount(response.data.totalCount);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to load backups:', error);
      dispatchShowToast({ type: 'danger', message: 'Failed to load backups' });
    } finally {
      setLoading(false);
    }
  }, [page, fromDate, toDate, backupType, storageType]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadBackups();
    } else {
      loadBackups();
    }
  }, [loadBackups, refreshKey]);

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

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    
    setBulkDeleteLoading(true);
    try {
      // Convert numbers to strings as the API expects string IDs
      const stringIds = ids.map(id => id.toString());
      await bulkDeleteBackups(stringIds);
      dispatchShowToast({ type: 'success', message: `${ids.length} backup(s) deleted successfully` });
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      loadBackups();
      onRefresh();
    } catch (error) {
      console.error('Bulk delete error:', error);
      dispatchShowToast({ type: 'danger', message: 'Failed to delete backups' });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === backups.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(backups.map(b => b.id)));
    }
  };

  const handleSelectOne = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const resetFilters = () => {
    setFromDate(null);
    setToDate(null);
    setBackupType('all');
    setStorageType('all');
    setPage(1);
    setShowFilters(false);
  };

  const handleDateChange = (field: string, value: Date | null) => {
    if (field === 'fromDate') {
      setFromDate(value);
    } else if (field === 'toDate') {
      setToDate(value);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const selectedCount = selectedIds.size;

  if (loading && backups.length === 0) {
    return (
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200/30 dark:border-gray-700/30 flex items-center justify-center"
        style={{
          background: isDarkMode ? 'rgba(17,24,39,0.4)' : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
        }}>
        <Loader type="circular" size={48} />
      </div>
    );
  }

  return (
    <GlassCard 
      variant="default" 
      padding="md" 
      className="flex-1 overflow-hidden flex flex-col w-full"
    >
      {/* Header with Filters and Actions */}
      <div className="flex flex-col gap-3 pb-4 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="cursor-pointer"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {(fromDate || toDate || backupType !== 'all' || storageType !== 'all') && (
                <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </Button>
            
            {/* View Toggle Buttons */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 px-3 transition-colors cursor-pointer",
                  viewMode === 'grid' 
                    ? "bg-blue-500 text-white" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title="Grid View"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 px-3 transition-colors cursor-pointer border-l",
                  viewMode === 'list' 
                    ? "bg-blue-500 text-white" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCount} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Trash className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {totalCount} backup{totalCount !== 1 ? 's' : ''}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCleanupDialogOpen(true)}
              className="cursor-pointer text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Cleanup Old
            </Button>
          </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">From Date</label>
              <DateTimeInput
                id="fromDate"
                label=""
                name="fromDate"
                value={fromDate}
                setValue={handleDateChange}
                placeholder="Select from date"
                showTime={false}
                showResetButton={true}
                model="Backup"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">To Date</label>
              <DateTimeInput
                id="toDate"
                label=""
                name="toDate"
                value={toDate}
                setValue={handleDateChange}
                placeholder="Select to date"
                showTime={false}
                showResetButton={true}
                model="Backup"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Backup Type</label>
              <Select value={backupType} onValueChange={setBackupType}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Storage Location</label>
              <Select value={storageType} onValueChange={setStorageType}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Local">Local</SelectItem>
                  <SelectItem value="RemoteServer">Remote Server</SelectItem>
                  <SelectItem value="GoogleDrive">Google Drive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="cursor-pointer">
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
              <Button size="sm" onClick={() => { setPage(1); loadBackups(); }} className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600">
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Select All */}
      {backups.length > 0 && (
        <div className="flex items-center gap-2 py-2 px-1">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            {selectedIds.size === backups.length ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {selectedIds.size === backups.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs text-gray-400">
            ({selectedIds.size} of {backups.length} selected)
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto py-4 relative">
        {loading && backups.length > 0 && (
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 flex items-center justify-center rounded-xl">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
              <Loader type="bars" size={32} />
            </div>
          </div>
        )}
        
        {backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium">No backups found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {backups.map((backup) => {
              const isManual = getBackupType(backup.name) === 'manual';
              const isSelected = selectedIds.has(backup.id);
              
              return (
                <Card 
                  key={backup.id}
                  className={cn(
                    "overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border",
                    isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200",
                    isSelected && "ring-2 ring-blue-500"
                  )}
                >
                  <CardContent className="p-4">
                    {/* Checkbox & Header */}
                    <div className="flex items-start gap-2 mb-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(backup.id)}
                        className="mt-1 cursor-pointer"
                      />
                      <div className="flex-1 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStorageIcon(backup.storageType)}
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            getStorageColor(backup.storageType)
                          )}>
                            {backup.storageType === 'RemoteServer' ? 'Remote' : backup.storageType}
                          </span>
                        </div>
                        {getStatusBadge(backup.status)}
                      </div>
                    </div>
                    
                    {/* Name - Full with word break */}
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm break-words">
                        {backup.name}
                      </h3>
                    </div>
                    
                    {/* Meta Info */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Type</span>
                        <Badge variant={isManual ? "default" : "secondary"} className="text-xs">
                          {isManual ? 'Manual' : 'Auto'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Size</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {formatFileSize(backup.fileSize)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Created</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {format(new Date(backup.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {/* List Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="col-span-1">Select</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Storage</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Created</div>
              <div className="col-span-2">Actions</div>
            </div>
            
            {backups.map((backup) => {
              const isManual = getBackupType(backup.name) === 'manual';
              const isSelected = selectedIds.has(backup.id);
              
              return (
                <div 
                  key={backup.id}
                  className={cn(
                    "grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg transition-all duration-200",
                    isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
                    isSelected && "bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500"
                  )}
                >
                  <div className="col-span-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectOne(backup.id)}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 break-words">
                      {backup.name}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                      getStorageColor(backup.storageType)
                    )}>
                      {getStorageIcon(backup.storageType)}
                      <span>{backup.storageType === 'RemoteServer' ? 'Remote' : backup.storageType}</span>
                    </span>
                  </div>
                  <div className="col-span-1">
                    <Badge variant={isManual ? "default" : "secondary"} className="text-xs">
                      {isManual ? 'Manual' : 'Auto'}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300">
                    {formatFileSize(backup.fileSize)}
                  </div>
                  <div className="col-span-1">
                    {getStatusBadge(backup.status)}
                  </div>
                  <div className="col-span-1 text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(backup.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(backup.id)}
                      className="p-1 rounded hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer group"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                    </button>
                    <button
                      onClick={() => {
                        setRestoreId(backup.id);
                        setRestoreDialogOpen(true);
                      }}
                      className="p-1 rounded hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors cursor-pointer group"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4 text-green-500 group-hover:text-green-600" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(backup.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-1 rounded hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors cursor-pointer group"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "min-w-[36px] transition-all duration-200",
                      pageNum === page && "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
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
          <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onCancel={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Bulk Delete Backups"
        variant="destructive"
        confirmLabel={bulkDeleteLoading ? 'Deleting...' : 'Delete'}
        loading={bulkDeleteLoading}
      >
        <div className="space-y-2">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Are you sure you want to delete {selectedCount} selected backup(s)?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
        </div>
      </ConfirmDialog>
    </GlassCard>
  );
}