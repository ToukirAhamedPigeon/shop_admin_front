// src/modules/settings/backup/components/backupMeta.ts
import { Cloud, HardDrive, Server, type LucideIcon } from 'lucide-react';

type Tone = 'info' | 'primary' | 'success' | 'muted';

/** Label, icon and colour for each storage location. */
export const STORAGE: Record<string, { label: string; short: string; icon: LucideIcon; tone: Tone }> = {
  Local: { label: 'Local disk', short: 'Local', icon: HardDrive, tone: 'info' },
  RemoteServer: { label: 'Remote server', short: 'Remote', icon: Server, tone: 'primary' },
  GoogleDrive: { label: 'Google Drive', short: 'Drive', icon: Cloud, tone: 'success' },
};

export const storageOf = (type: string) =>
  STORAGE[type] ?? { label: type, short: type, icon: HardDrive, tone: 'muted' as Tone };

/** Soft tile (icon backgrounds, chips). */
export const toneSoft: Record<Tone, string> = {
  info: 'bg-info/10 text-info',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  muted: 'bg-muted text-muted-foreground',
};

/** Solid fill (bars, dots). */
export const toneFill: Record<Tone, string> = {
  info: 'bg-info',
  primary: 'bg-primary',
  success: 'bg-success',
  muted: 'bg-muted-foreground',
};

export const STATUS: Record<string, { label: string; className: string; dot: string }> = {
  Success: { label: 'Success', className: 'bg-success/10 text-success', dot: 'bg-success' },
  Failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  InProgress: { label: 'In progress', className: 'bg-warning/10 text-warning', dot: 'bg-warning animate-pulse' },
};

export const statusOf = (status: string) =>
  STATUS[status] ?? { label: status, className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' };

/** Scheduled backups have "auto" in their name; everything else was started by hand. */
export const backupKind = (name: string) => (!name.includes('manual') && name.includes('auto') ? 'auto' : 'manual');
