// src/modules/settings/backup/components/ScheduleManager.tsx
import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { Plus, Trash2, RefreshCw, CalendarClock, AlertCircle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSchedules, createSchedule, deleteSchedule, getStorageDestinations } from '../api';
import type { BackupSchedule, StorageDestination } from '../types';
import { dispatchShowToast } from '@/lib/dispatch';
import { cn } from '@/lib/utils';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import GlassCard from '@/components/custom/GlassCard';
import { storageOf, toneSoft } from './backupMeta';

interface ScheduleManagerProps {
  onScheduleChange?: () => void;
}

const UNITS = ['minutes', 'hours', 'days', 'weeks', 'months', 'years'];

// "Every 1 days" → "Every day", "Every 6 hours".
const every = (n: number, unit: string) => {
  const one = unit.replace(/s$/, '');
  return n === 1 ? `Every ${one}` : `Every ${n} ${unit}`;
};

const nextRun = (iso?: string) => {
  if (!iso) return null;
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return null;
  return { relative: d.getTime() > Date.now() ? `in ${formatDistanceToNowStrict(d)}` : 'due now', exact: format(d, 'MMM d, HH:mm') };
};

const emptyForm = (destinations: StorageDestination[]) => ({
  name: '',
  intervalValue: 1,
  intervalUnit: 'days',
  retentionDays: 7,
  storageDestinations: destinations.map((d) => d.type) as string[],
  isActive: true,
});

export default function ScheduleManager({ onScheduleChange }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<StorageDestination[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm([]));
  const [nameError, setNameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupSchedule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSchedules();
      setSchedules(Array.isArray(res.data?.schedules) ? res.data.schedules : []);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      dispatchShowToast({ type: 'danger', message: 'Failed to load schedules' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDestinations = useCallback(async () => {
    try {
      const res = await getStorageDestinations();
      const dests = res.data?.destinations || [];
      setDestinations(dests);
      setForm((f) => ({ ...f, storageDestinations: dests.map((d) => d.type) }));
    } catch (error) {
      console.error('Failed to load destinations:', error);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
    loadDestinations();
  }, [loadSchedules, loadDestinations]);

  const openForm = () => {
    setForm(emptyForm(destinations));
    setNameError(null);
    setFormOpen(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setNameError('Give the schedule a name');
      return;
    }
    if (form.storageDestinations.length === 0) {
      dispatchShowToast({ type: 'warning', message: 'Select at least one storage destination' });
      return;
    }
    setSubmitting(true);
    try {
      await createSchedule({
        name: form.name.trim(),
        intervalValue: Math.max(1, form.intervalValue),
        intervalUnit: form.intervalUnit,
        retentionDays: Math.max(1, form.retentionDays),
        storageDestinations: form.storageDestinations,
        isActive: form.isActive,
      });
      dispatchShowToast({ type: 'success', message: 'Schedule created' });
      setFormOpen(false);
      await loadSchedules();
      onScheduleChange?.();
    } catch {
      dispatchShowToast({ type: 'danger', message: 'Failed to create schedule' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSchedule(deleteTarget.id);
      dispatchShowToast({ type: 'success', message: 'Schedule deleted' });
      setDeleteTarget(null);
      await loadSchedules();
      onScheduleChange?.();
    } catch {
      dispatchShowToast({ type: 'danger', message: 'Failed to delete schedule' });
    } finally {
      setDeleting(false);
    }
  };

  const toggleDestination = (type: string) =>
    setForm((f) => {
      const set = new Set(f.storageDestinations);
      if (set.has(type)) set.delete(type);
      else set.add(type);
      return { ...f, storageDestinations: Array.from(set) };
    });

  return (
    <GlassCard variant="default" padding="none" hoverEffect={false} className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">Schedules</h3>
          {!loading && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">{schedules.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={loadSchedules} aria-label="Reload schedules" title="Reload schedules">
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </Button>
          <Button size="sm" onClick={openForm}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {loading && schedules.length === 0 ? (
          <div className="space-y-2" aria-hidden>
            {[0, 1].map((i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="size-5" />
            </span>
            <p className="text-sm font-medium text-foreground">No schedules yet</p>
            <p className="text-xs text-muted-foreground">Back up automatically, for example every day at the same time.</p>
            <Button variant="outline" size="sm" onClick={openForm} className="mt-1">
              <Plus className="size-4" />
              Add a schedule
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {schedules.map((s) => {
              const next = s.isActive ? nextRun(s.nextRunAt) : null;
              return (
                <li key={s.id} className="group rounded-xl border border-border p-3 transition-colors hover:border-primary/30">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                        s.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <CalendarClock className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground" title={s.name}>
                          {s.name}
                        </p>
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                            s.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <span className={cn('size-1.5 rounded-full', s.isActive ? 'bg-success' : 'bg-muted-foreground')} />
                          {s.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {every(s.intervalValue, s.intervalUnit)} · keep {s.retentionDays} day{s.retentionDays === 1 ? '' : 's'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {(s.storageDestinations ?? []).map((d) => {
                          const st = storageOf(d);
                          const Icon = st.icon;
                          return (
                            <span key={d} className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium', toneSoft[st.tone])}>
                              <Icon className="size-3" />
                              {st.short}
                            </span>
                          );
                        })}
                        {next && (
                          <span className="ml-auto text-[11px] text-muted-foreground" title={next.exact}>
                            Next {next.relative}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(s)}
                      aria-label={`Delete ${s.name}`}
                      title="Delete schedule"
                      className="-mr-1 -mt-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* New schedule */}
      <Dialog open={formOpen} onOpenChange={(open) => !submitting && setFormOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>New backup schedule</DialogTitle>
            <DialogDescription>Backups run automatically at this interval and older ones are removed after the retention period.</DialogDescription>
          </DialogHeader>

          <form
            id="schedule-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="schedule-name">Name</Label>
              <Input
                id="schedule-name"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setNameError(null);
                }}
                placeholder="e.g. Nightly backup"
                aria-invalid={!!nameError}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>

            <div className="grid grid-cols-[1fr_1.4fr] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="schedule-every">Every</Label>
                <Input
                  id="schedule-every"
                  type="number"
                  min={1}
                  value={form.intervalValue}
                  onChange={(e) => setForm({ ...form, intervalValue: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.intervalUnit} onValueChange={(val) => setForm({ ...form, intervalUnit: val })}>
                  <SelectTrigger className="w-full" aria-label="Interval unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u[0].toUpperCase() + u.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="schedule-retention">Keep backups for (days)</Label>
              <Input
                id="schedule-retention"
                type="number"
                min={1}
                value={form.retentionDays}
                onChange={(e) => setForm({ ...form, retentionDays: parseInt(e.target.value) || 7 })}
              />
            </div>

            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium leading-none">Save to</legend>
              {destinations.length === 0 ? (
                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-sm text-warning">
                  <AlertCircle className="size-4 shrink-0" />
                  No storage destinations are configured yet.
                </div>
              ) : (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {destinations.map((d) => {
                    const st = storageOf(d.type);
                    const Icon = st.icon;
                    const on = form.storageDestinations.includes(d.type);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggleDestination(d.type)}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                          on ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-accent'
                        )}
                      >
                        <Icon className="size-4" />
                        {d.name}
                        {on && <Check className="size-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <label htmlFor="schedule-active" className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                id="schedule-active"
                checked={form.isActive}
                onCheckedChange={(c) => setForm({ ...form, isActive: !!c })}
              />
              Start running now
            </label>
          </form>

          <DialogFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="schedule-form" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete schedule"
        variant="destructive"
        confirmLabel="Delete"
        loading={deleting}
      >
        <p>
          Delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>? Automatic backups on this schedule will stop.
        </p>
      </ConfirmDialog>
    </GlassCard>
  );
}
