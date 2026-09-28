// src/modules/settings/backup/components/BackupList.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  Download,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  X,
  Database,
  LayoutGrid,
  List,
  Eraser,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { dispatchShowToast } from '@/lib/dispatch';
import { formatFileSize } from '@/lib/helpers';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import GlassCard from '@/components/custom/GlassCard';
import DateTimeInput from '@/components/custom/FormInputs';
import { ErrorState } from '@/components/custom/Table';
import { getBackups, deleteBackup, downloadBackup, restoreBackup, cleanOldBackups, bulkDeleteBackups } from '../api';
import type { Backup, BackupFilterRequest } from '../types';
import { backupKind, statusOf, storageOf, toneSoft } from './backupMeta';

interface BackupListProps {
  onRefresh: () => void;
  refreshKey: number;
}

const ITEMS_PER_PAGE = 12;
const VIEW_KEY = 'backup-view';

type ViewMode = 'grid' | 'list';

const readView = (): ViewMode => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
};

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'MMM d, yyyy · HH:mm');
};

/** Row of one-tap filter chips. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 rounded-lg border border-border bg-muted/50 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'cursor-pointer rounded-md px-2.5 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'bg-card font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = statusOf(status);
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', s.className)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

function KindChip({ name }: { name: string }) {
  const auto = backupKind(name) === 'auto';
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {auto ? 'Scheduled' : 'Manual'}
    </span>
  );
}

function Actions({
  backup,
  busy,
  onDownload,
  onRestore,
  onDelete,
}: {
  backup: Backup;
  busy: boolean;
  onDownload: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const btn =
    'flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40';
  const ok = backup.status === 'Success';
  return (
    <div className="flex items-center">
      <button type="button" onClick={onDownload} disabled={!ok || busy} title="Download" aria-label={`Download ${backup.name}`} className={cn(btn, 'hover:bg-accent hover:text-foreground')}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      </button>
      <button type="button" onClick={onRestore} disabled={!ok} title="Restore" aria-label={`Restore ${backup.name}`} className={cn(btn, 'hover:bg-warning/10 hover:text-warning')}>
        <RotateCcw className="size-4" />
      </button>
      <button type="button" onClick={onDelete} title="Delete" aria-label={`Delete ${backup.name}`} className={cn(btn, 'hover:bg-destructive/10 hover:text-destructive')}>
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function BackupList({ onRefresh, refreshKey }: BackupListProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(readView);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Filters apply as soon as they change.
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [backupType, setBackupType] = useState<'all' | 'manual' | 'auto'>('all');
  const [storageType, setStorageType] = useState<'all' | 'Local' | 'RemoteServer' | 'GoogleDrive'>('all');
  const [showDates, setShowDates] = useState(false);

  const latest = useRef(0);

  const loadBackups = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setLoadError(false);
    try {
      const filter: BackupFilterRequest = { page, limit: ITEMS_PER_PAGE, sortBy: 'createdAt', sortOrder: 'desc' };
      if (fromDate) filter.fromDate = fromDate.toISOString();
      if (toDate) filter.toDate = toDate.toISOString();
      if (backupType !== 'all') filter.q = backupType;
      if (storageType !== 'all') filter.storageType = storageType;

      const response = await getBackups(filter);
      if (request !== latest.current) return;
      setBackups(Array.isArray(response.data?.backups) ? response.data.backups : []);
      setTotalCount(Number(response.data?.totalCount) || 0);
      setSelectedIds(new Set());
    } catch (error) {
      if (request !== latest.current) return;
      console.error('Failed to load backups:', error);
      setLoadError(true);
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, fromDate, toDate, backupType, storageType]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups, refreshKey]);

  const changeView = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* private mode: kept for this visit only */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteBackup(deleteTarget.id);
      dispatchShowToast({ type: 'success', message: 'Backup deleted' });
      setDeleteTarget(null);
      loadBackups();
      onRefresh();
    } catch {
      dispatchShowToast({ type: 'danger', message: 'Failed to delete backup' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoreLoading(true);
    try {
      await restoreBackup(restoreTarget.id);
      dispatchShowToast({ type: 'success', message: 'Backup restored' });
      setRestoreTarget(null);
    } catch {
      dispatchShowToast({ type: 'danger', message: 'Failed to restore backup' });
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleDownload = async (backup: Backup) => {
    setDownloadingId(backup.id);
    try {
      const response = await downloadBackup(backup.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backup.fileName || 'backup.sql');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      dispatchShowToast({ type: 'danger', message: 'Failed to download backup' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCleanup = async () => {
    setCleanupLoading(true);
    try {
      await cleanOldBackups(7);
      dispatchShowToast({ type: 'success', message: 'Old backups cleaned up' });
      setCleanupDialogOpen(false);
      loadBackups();
      onRefresh();
    } catch {
      dispatchShowToast({ type: 'danger', message: 'Failed to clean up backups' });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkDeleteLoading(true);
    try {
      // The API expects string ids.
      await bulkDeleteBackups(ids.map((id) => id.toString()));
      dispatchShowToast({ type: 'success', message: `${ids.length} backup${ids.length > 1 ? 's' : ''} deleted` });
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

  const toggleOne = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = backups.length > 0 && selectedIds.size === backups.length;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(backups.map((b) => b.id)));

  const filtersActive = !!(fromDate || toDate || backupType !== 'all' || storageType !== 'all');
  const resetFilters = () => {
    setFromDate(null);
    setToDate(null);
    setBackupType('all');
    setStorageType('all');
    setPage(1);
  };

  const handleDateChange = (field: string, value: Date | null) => {
    setPage(1);
    if (field === 'fromDate') setFromDate(value);
    else if (field === 'toDate') setToDate(value);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const selectedCount = selectedIds.size;
  const firstLoad = loading && backups.length === 0 && !loadError;

  const actionsFor = (backup: Backup) => (
    <Actions
      backup={backup}
      busy={downloadingId === backup.id}
      onDownload={() => handleDownload(backup)}
      onRestore={() => setRestoreTarget(backup)}
      onDelete={() => setDeleteTarget(backup)}
    />
  );

  return (
    <GlassCard variant="default" padding="none" hoverEffect={false} className="flex w-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="space-y-3 border-b border-border p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Backups</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div role="radiogroup" aria-label="View" className="flex rounded-lg border border-border bg-muted/50 p-0.5">
              {(
                [
                  ['grid', LayoutGrid, 'Grid view'],
                  ['list', List, 'List view'],
                ] as const
              ).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={viewMode === mode}
                  aria-label={label}
                  title={label}
                  onClick={() => changeView(mode)}
                  className={cn(
                    'flex size-7 cursor-pointer items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    viewMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCleanupDialogOpen(true)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Delete backups older than 7 days"
            >
              <Eraser className="size-4" />
              <span className="hidden sm:inline">Clean up</span>
            </Button>
          </div>
        </div>

        {/* Filters, or the bulk bar while something is selected */}
        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primary/5 px-2 py-1.5">
            <Checkbox checked={allSelected ? true : 'indeterminate'} onCheckedChange={toggleAll} aria-label="Select all on this page" className="ml-1" />
            <span className="mr-auto text-sm font-medium text-foreground">{selectedCount} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {backups.length > 0 && (
              <Checkbox checked={false} onCheckedChange={toggleAll} aria-label="Select all on this page" className="ml-1 mr-1" />
            )}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <Segmented
                label="Storage"
                value={storageType}
                onChange={(v) => {
                  setStorageType(v);
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All storage' },
                  { value: 'Local', label: 'Local' },
                  { value: 'RemoteServer', label: 'Remote' },
                  { value: 'GoogleDrive', label: 'Drive' },
                ]}
              />
              <Segmented
                label="Type"
                value={backupType}
                onChange={(v) => {
                  setBackupType(v);
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'manual', label: 'Manual' },
                  { value: 'auto', label: 'Scheduled' },
                ]}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDates((s) => !s)}
              aria-expanded={showDates}
              className={cn((fromDate || toDate) && 'border-primary/40 text-primary')}
            >
              <CalendarRange className="size-4" />
              Dates
              {(fromDate || toDate) && <span className="size-1.5 rounded-full bg-primary" />}
            </Button>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="size-4" />
                Reset
              </Button>
            )}
          </div>
        )}

        {showDates && selectedCount === 0 && (
          <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
              <DateTimeInput
                id="fromDate"
                label=""
                name="fromDate"
                value={fromDate}
                setValue={handleDateChange}
                placeholder="Any date"
                showTime={false}
                showResetButton={true}
                model="Backup"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
              <DateTimeInput
                id="toDate"
                label=""
                name="toDate"
                value={toDate}
                setValue={handleDateChange}
                placeholder="Any date"
                showTime={false}
                showResetButton={true}
                model="Backup"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('min-h-[240px] p-3 transition-opacity duration-200 sm:p-4', loading && !firstLoad && 'opacity-60')} aria-busy={loading}>
        {firstLoad ? (
          <GridSkeleton />
        ) : loadError && backups.length === 0 ? (
          <ErrorState message="Couldn't load backups" suggestion="Check your connection and try again." onRetry={loadBackups} />
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <span className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Database className="size-7" />
            </span>
            <p className="text-base font-medium text-foreground">{filtersActive ? 'No backups match these filters' : 'No backups yet'}</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {filtersActive ? 'Try another storage location, type or date range.' : 'Create a backup now, or add a schedule to back up automatically.'}
            </p>
            {filtersActive && (
              <Button variant="link" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {backups.map((backup) => {
              const storage = storageOf(backup.storageType);
              const Icon = storage.icon;
              const selected = selectedIds.has(backup.id);
              return (
                <li
                  key={backup.id}
                  className={cn(
                    'group relative flex flex-col rounded-xl border bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:shadow-sm',
                    selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', toneSoft[storage.tone])}>
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground" title={backup.name}>
                        {backup.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{storage.label}</p>
                    </div>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleOne(backup.id)}
                      aria-label={`Select ${backup.name}`}
                      className={cn('mt-0.5 transition-opacity', !selected && 'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100')}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <StatusPill status={backup.status} />
                    <KindChip name={backup.name} />
                    <span className="ml-auto text-xs font-medium tabular-nums text-foreground/80">{formatFileSize(backup.fileSize)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
                    <time dateTime={backup.createdAt} className="text-xs text-muted-foreground">
                      {when(backup.createdAt)}
                    </time>
                    {actionsFor(backup)}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="hidden grid-cols-[28px_minmax(0,1fr)_32px_96px_72px_104px] items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground md:grid">
              <span />
              <span>Name</span>
              <span className="sr-only">Storage</span>
              <span>Status</span>
              <span className="text-right">Size</span>
              <span className="sr-only">Actions</span>
            </div>
            <ul className="divide-y divide-border">
              {backups.map((backup) => {
                const storage = storageOf(backup.storageType);
                const Icon = storage.icon;
                const selected = selectedIds.has(backup.id);
                return (
                  <li
                    key={backup.id}
                    className={cn(
                      'grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2.5 transition-colors md:grid-cols-[28px_minmax(0,1fr)_32px_96px_72px_104px]',
                      selected ? 'bg-primary/5' : 'hover:bg-accent/50'
                    )}
                  >
                    <Checkbox checked={selected} onCheckedChange={() => toggleOne(backup.id)} aria-label={`Select ${backup.name}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground" title={backup.name}>
                        {backup.name}
                      </p>
                      {/* Phones: the other columns fold under the name. */}
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground md:hidden">
                        <StatusPill status={backup.status} />
                        <span>{storage.short}</span>
                        <span>{formatFileSize(backup.fileSize)}</span>
                        <span>{when(backup.createdAt)}</span>
                      </p>
                      <time dateTime={backup.createdAt} className="mt-0.5 hidden text-xs text-muted-foreground md:block">
                        {when(backup.createdAt)}
                      </time>
                    </div>
                    <span
                      title={storage.label}
                      aria-label={storage.label}
                      className={cn('hidden size-7 items-center justify-center rounded-md md:flex', toneSoft[storage.tone])}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="hidden md:block">
                      <StatusPill status={backup.status} />
                    </span>
                    <span className="hidden text-right text-sm tabular-nums text-foreground/85 md:block">{formatFileSize(backup.fileSize)}</span>
                    <div className="justify-self-end">{actionsFor(backup)}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 sm:px-4">
          <span className="text-xs tabular-nums text-muted-foreground sm:text-sm">
            {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete backup"
        variant="destructive"
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        loading={deleteLoading}
      >
        <p>
          Delete <span className="font-medium text-foreground [overflow-wrap:anywhere]">{deleteTarget?.name}</span>? This can't be undone.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!restoreTarget}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore backup"
        variant="warning"
        confirmLabel={restoreLoading ? 'Restoring…' : 'Restore'}
        loading={restoreLoading}
      >
        <div className="space-y-2">
          <p className="font-medium text-foreground">
            Restore <span className="[overflow-wrap:anywhere]">{restoreTarget?.name}</span>?
          </p>
          <p className="text-sm text-muted-foreground">
            The current database will be replaced with this backup ({restoreTarget ? when(restoreTarget.createdAt) : ''}). Changes made since then will be lost.
          </p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={cleanupDialogOpen}
        onCancel={() => setCleanupDialogOpen(false)}
        onConfirm={handleCleanup}
        title="Clean up old backups"
        variant="destructive"
        confirmLabel={cleanupLoading ? 'Cleaning…' : 'Clean up'}
        loading={cleanupLoading}
      >
        <div className="space-y-2">
          <p className="font-medium text-foreground">Delete every backup older than 7 days?</p>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onCancel={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete backups"
        variant="destructive"
        confirmLabel={bulkDeleteLoading ? 'Deleting…' : 'Delete'}
        loading={bulkDeleteLoading}
      >
        <div className="space-y-2">
          <p className="font-medium text-foreground">
            Delete {selectedCount} selected backup{selectedCount > 1 ? 's' : ''}?
          </p>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
        </div>
      </ConfirmDialog>
    </GlassCard>
  );
}
