// src/modules/settings/backup/pages/BackupPage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Plus, RefreshCw, Database, CheckCircle2, AlertTriangle, Clock, History, Check } from 'lucide-react';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { dispatchShowToast } from '@/lib/dispatch';
import { formatFileSize } from '@/lib/helpers';
import { can } from '@/lib/authCheck';
import { cn } from '@/lib/utils';
import BackupList from '../components/BackupList';
import ScheduleManager from '../components/ScheduleManager';
import { storageOf, toneFill, toneSoft } from '../components/backupMeta';
import { getBackupStatistics, createBackup, getStorageDestinations } from '../api';
import type { BackupStatistics, StorageDestination } from '../types';

const relative = (iso?: string) => {
  if (!iso) return null;
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? null : formatDistanceToNow(d, { addSuffix: true });
};

/** Share of successful backups as a ring. */
function SuccessRing({ percent, tone }: { percent: number | null; tone: 'success' | 'warning' | 'muted' }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const stroke = { success: 'stroke-success', warning: 'stroke-warning', muted: 'stroke-muted-foreground' }[tone];
  return (
    <div className="relative size-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        {percent !== null && (
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - percent / 100)}
            className={cn(stroke, 'transition-[stroke-dashoffset] duration-500 ease-out')}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-sm font-bold tabular-nums text-foreground">{percent === null ? '—' : `${percent}%`}</span>
        <span className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">success</span>
      </span>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/40 px-3.5 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function BackupPage() {
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [storageDestinations, setStorageDestinations] = useState<StorageDestination[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<string>('');

  const hasCreatePermission = can(['create-admin-backups']);
  const hasSchedulePermission = can(['create-admin-backups']);

  // Counts from the previous load: when they change, the list is reloaded too.
  const prevBackupCountRef = useRef<number | null>(null);
  const prevSuccessCountRef = useRef<number | null>(null);

  const refreshList = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const response = await getBackupStatistics();
      const newStats = response.data;
      setStatistics(newStats);

      const prevCount = prevBackupCountRef.current;
      const prevSuccess = prevSuccessCountRef.current;
      if (
        (prevCount !== null && newStats.totalBackups !== prevCount) ||
        (prevSuccess !== null && newStats.successCount !== prevSuccess)
      ) {
        refreshList();
      }
      prevBackupCountRef.current = newStats.totalBackups;
      prevSuccessCountRef.current = newStats.successCount;
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [refreshList]);

  const loadStorageDestinations = useCallback(async () => {
    try {
      const response = await getStorageDestinations();
      const dests = response.data.destinations || [];
      setStorageDestinations(dests);
      if (dests.some((d) => d.type === 'RemoteServer')) setSelectedDestinations(['RemoteServer']);
    } catch (error) {
      console.error('Failed to load storage destinations:', error);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    refreshList();
    setRefreshing(false);
  };

  const handleCreateBackup = async () => {
    if (selectedDestinations.length === 0) {
      dispatchShowToast({ type: 'warning', message: 'Select at least one storage destination' });
      return;
    }
    setBackupLoading(true);
    try {
      await createBackup({ storageDestinations: selectedDestinations });
      dispatchShowToast({ type: 'success', message: 'Backup created' });
      setBackupDialogOpen(false);
      handleRefresh();
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      dispatchShowToast({ type: 'danger', message: message || 'Failed to create backup' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleOpenDialog = () => {
    loadStorageDestinations();
    setBackupDialogOpen(true);
  };

  const toggleDestination = (type: string) =>
    setSelectedDestinations((prev) => (prev.includes(type) ? prev.filter((d) => d !== type) : [...prev, type]));

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // "in 3 hours", kept current every 30 seconds.
  useEffect(() => {
    if (!statistics?.nextBackupAt) {
      setCountdown('');
      return;
    }
    const next = parseISO(statistics.nextBackupAt);
    if (Number.isNaN(next.getTime())) {
      setCountdown('');
      return;
    }
    const tick = () => setCountdown(next.getTime() <= Date.now() ? 'any moment now' : formatDistanceToNow(next, { addSuffix: true }));
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [statistics?.nextBackupAt]);

  const finished = statistics ? statistics.successCount + statistics.failedCount : 0;
  const successRate = statistics && finished > 0 ? Math.round((statistics.successCount / finished) * 100) : null;
  const health: 'success' | 'warning' | 'muted' = !statistics || finished === 0 ? 'muted' : statistics.failedCount > 0 ? 'warning' : 'success';
  const lastBackup = relative(statistics?.lastBackupAt);

  const usage = statistics?.storageUsed
    ? [
        { type: 'Local', bytes: statistics.storageUsed.local || 0 },
        { type: 'RemoteServer', bytes: statistics.storageUsed.remoteServer || 0 },
        { type: 'GoogleDrive', bytes: statistics.storageUsed.googleDrive || 0 },
      ]
    : [];
  const usageTotal = usage.reduce((sum, u) => sum + u.bytes, 0);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 [&>*:first-child]:min-w-0">
        <Breadcrumb
          title="common.backup.title"
          defaultTitle="Backup"
          showTitle={true}
          items={[{ label: 'common.backup.title', defaultLabel: 'Backup', href: '/backup' }]}
          className="pb-0"
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm" aria-label="Refresh">
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {hasCreatePermission && (
            <Button onClick={handleOpenDialog} size="sm">
              <Plus className="size-4" />
              Back up now
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <GlassCard variant="default" padding="none" hoverEffect={false}>
        {statsLoading ? (
          <div className="grid animate-pulse gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]" aria-hidden>
            <div className="flex items-center gap-4">
              <div className="size-[68px] rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[74px] rounded-xl bg-muted/60" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:items-center">
            <div className="flex items-center gap-4">
              <SuccessRing percent={successRate} tone={health} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                  {health === 'success' ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : health === 'warning' ? (
                    <AlertTriangle className="size-4 text-warning" />
                  ) : (
                    <Database className="size-4 text-muted-foreground" />
                  )}
                  {health === 'success'
                    ? 'Backups are healthy'
                    : health === 'warning'
                      ? `${statistics?.failedCount} backup${statistics?.failedCount === 1 ? '' : 's'} failed`
                      : 'No backups yet'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <History className="size-3.5 shrink-0" />
                  <span className="truncate">{lastBackup ? `Last backup ${lastBackup}` : 'No backup has run yet'}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {countdown ? (
                      <>
                        Next backup <span className="font-medium text-foreground">{countdown}</span>
                      </>
                    ) : (
                      'No backup scheduled'
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Total backups" value={(statistics?.totalBackups ?? 0).toLocaleString()} />
                <StatTile label="Total size" value={formatFileSize(statistics?.totalSize || 0)} />
                <StatTile label="Successful" value={(statistics?.successCount ?? 0).toLocaleString()} />
                <StatTile
                  label="Failed"
                  value={<span className={cn(statistics?.failedCount ? 'text-destructive' : undefined)}>{(statistics?.failedCount ?? 0).toLocaleString()}</span>}
                />
              </div>

              {usageTotal > 0 && (
                <div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label="Storage used by location">
                    {usage
                      .filter((u) => u.bytes > 0)
                      .map((u) => (
                        <div
                          key={u.type}
                          className={cn('h-full first:rounded-l-full last:rounded-r-full', toneFill[storageOf(u.type).tone])}
                          style={{ width: `${Math.max(2, (u.bytes / usageTotal) * 100)}%` }}
                        />
                      ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {usage.map((u) => {
                      const st = storageOf(u.type);
                      return (
                        <span key={u.type} className="inline-flex items-center gap-1.5">
                          <span className={cn('size-2 rounded-full', toneFill[st.tone])} />
                          {st.label}
                          <span className="font-medium tabular-nums text-foreground">{formatFileSize(u.bytes)}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Backups, with schedules beside them on wide screens */}
      <div className={cn('grid min-h-0 flex-1 grid-cols-1 items-start gap-4', hasSchedulePermission && 'xl:grid-cols-[minmax(0,1fr)_360px]')}>
        <BackupList key={refreshKey} onRefresh={handleRefresh} refreshKey={refreshKey} />
        {hasSchedulePermission && (
          <ScheduleManager
            onScheduleChange={() => {
              loadStatistics();
              refreshList();
            }}
          />
        )}
      </div>

      <ConfirmDialog
        open={backupDialogOpen}
        onCancel={() => setBackupDialogOpen(false)}
        onConfirm={handleCreateBackup}
        title="Back up the database now"
        variant="info"
        icon={<Database className="size-6" />}
        confirmLabel={backupLoading ? 'Backing up…' : 'Start backup'}
        loading={backupLoading}
      >
        <div className="space-y-3 text-left">
          <p className="text-sm text-muted-foreground">Choose where to save this backup:</p>
          <div className="space-y-2">
            {storageDestinations.map((dest) => {
              const st = storageOf(dest.type);
              const Icon = st.icon;
              const on = selectedDestinations.includes(dest.type);
              return (
                <button
                  key={dest.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleDestination(dest.type)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    on ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  )}
                >
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', toneSoft[st.tone])}>
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{dest.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {st.label}
                      {dest.isPrimary ? ' · Primary' : ''}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                    )}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>
          {storageDestinations.length === 0 && (
            <p className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-sm text-warning">
              <AlertTriangle className="size-4 shrink-0" />
              No storage destinations are configured yet.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}
