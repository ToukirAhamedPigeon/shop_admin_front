// src/modules/backup/components/ScheduleManager.tsx
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSchedules, createSchedule, deleteSchedule, getStorageDestinations } from '../api';
import type { BackupSchedule, StorageDestination } from '../types';
import { dispatchShowToast } from '@/lib/dispatch';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import GlassCard from '@/components/custom/GlassCard';

interface ScheduleManagerProps {
  onScheduleChange?: () => void;
}

export default function ScheduleManager({ onScheduleChange }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<StorageDestination[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    intervalValue: 1,
    intervalUnit: 'days',
    retentionDays: 7,
    storageDestinations: [] as string[],
    isActive: true,
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadSchedules = async () => {
    try {
      const res = await getSchedules();
      setSchedules(res.data.schedules || []);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      dispatchShowToast({ type: 'danger', message: 'Failed to load schedules' });
    } finally {
      setLoading(false);
    }
  };

  const loadDestinations = async () => {
    try {
      const res = await getStorageDestinations();
      const dests = res.data.destinations || [];
      setDestinations(dests);
      if (dests.length > 0) {
        setNewSchedule(prev => ({
          ...prev,
          storageDestinations: dests.map(d => d.type),
        }));
      } else {
        setNewSchedule(prev => ({ ...prev, storageDestinations: [] }));
      }
    } catch (error) {
      console.error('Failed to load destinations:', error);
    }
  };

  useEffect(() => {
    loadSchedules();
    loadDestinations();
  }, []);

  const handleCreate = async () => {
    if (!newSchedule.name.trim()) {
      dispatchShowToast({ type: 'warning', message: 'Name is required' });
      return;
    }
    if (newSchedule.intervalValue < 1) {
      dispatchShowToast({ type: 'warning', message: 'Interval must be at least 1' });
      return;
    }
    if (newSchedule.storageDestinations.length === 0) {
      dispatchShowToast({ type: 'warning', message: 'Select at least one storage destination' });
      return;
    }
    setSubmitting(true);
    try {
      await createSchedule({
        name: newSchedule.name,
        intervalValue: newSchedule.intervalValue,
        intervalUnit: newSchedule.intervalUnit,
        retentionDays: newSchedule.retentionDays,
        storageDestinations: newSchedule.storageDestinations,
        isActive: newSchedule.isActive,
      });
      dispatchShowToast({ type: 'success', message: 'Schedule created' });
      setShowForm(false);
      setNewSchedule({
        name: '',
        intervalValue: 1,
        intervalUnit: 'days',
        retentionDays: 7,
        storageDestinations: destinations.map(d => d.type),
        isActive: true,
      });
      await loadSchedules();
      
      // 🔥 Notify parent to refresh statistics
      if (onScheduleChange) {
        onScheduleChange();
      }
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to create schedule' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSchedule(deleteId);
      dispatchShowToast({ type: 'success', message: 'Schedule deleted' });
      setDeleteDialogOpen(false);
      setDeleteId(null);
      await loadSchedules();
      
      // 🔥 Notify parent to refresh statistics
      if (onScheduleChange) {
        onScheduleChange();
      }
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to delete schedule' });
    }
  };

  const toggleDestination = (type: string) => {
    setNewSchedule(prev => {
      const set = new Set(prev.storageDestinations);
      if (set.has(type)) set.delete(type);
      else set.add(type);
      return { ...prev, storageDestinations: Array.from(set) };
    });
  };

  return (
    <GlassCard variant="primary" padding="md" className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Backup Schedules
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSchedules}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" /> Add Schedule
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-4 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label>Schedule Name</Label>
              <Input
                value={newSchedule.name}
                onChange={e => setNewSchedule({ ...newSchedule, name: e.target.value })}
                placeholder="e.g., Daily Backup"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Every</Label>
                <Input
                  type="number"
                  min="1"
                  value={newSchedule.intervalValue}
                  onChange={e => setNewSchedule({ ...newSchedule, intervalValue: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Select
                  value={newSchedule.intervalUnit}
                  onValueChange={val => setNewSchedule({ ...newSchedule, intervalUnit: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Retention (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={newSchedule.retentionDays}
                  onChange={e => setNewSchedule({ ...newSchedule, retentionDays: parseInt(e.target.value) || 7 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="schedule-active"
                checked={newSchedule.isActive}
                onCheckedChange={c => setNewSchedule({ ...newSchedule, isActive: !!c })}
              />
              <Label htmlFor="schedule-active" className="cursor-pointer">Active</Label>
            </div>

            <div>
              <Label>Storage Destinations</Label>
              {destinations.length === 0 ? (
                <div className="flex items-center gap-2 mt-1 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    No storage destinations configured. Please create one first.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {destinations.map(d => (
                    <div key={d.id} className="flex items-center gap-1">
                      <Checkbox
                        id={`dest-${d.id}`}
                        checked={newSchedule.storageDestinations.includes(d.type)}
                        onCheckedChange={() => toggleDestination(d.type)}
                      />
                      <Label htmlFor={`dest-${d.id}`} className="text-sm cursor-pointer">
                        {d.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p>Loading schedules...</p>
      ) : schedules.length === 0 ? (
        <p className="text-gray-500 text-sm">No schedules configured.</p>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                <span className="font-medium">{s.name}</span>
                <span className="text-sm text-gray-500">
                  Every {s.intervalValue} {s.intervalUnit}
                </span>
                <span className="text-sm">
                  {s.isActive ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </span>
                <span className="text-sm text-gray-500">
                  Next: {s.nextRunAt ? format(parseISO(s.nextRunAt), 'MMM dd, HH:mm') : '—'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDeleteId(s.id); setDeleteDialogOpen(true); }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Schedule"
        variant="destructive"
        confirmLabel="Delete"
      >
        <p>Are you sure you want to delete this schedule?</p>
      </ConfirmDialog>
    </GlassCard>
  );
}