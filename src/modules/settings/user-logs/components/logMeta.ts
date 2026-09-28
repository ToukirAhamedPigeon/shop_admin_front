// src/modules/settings/user-logs/components/logMeta.ts
import {
  Activity,
  Ban,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { parseChanges } from '@/lib/helpers';

type Tone = 'success' | 'info' | 'destructive' | 'warning' | 'primary' | 'muted';

interface ActionMeta {
  label: string;
  /** Past-tense verb for "Toukir <verb> User". */
  verb: string;
  icon: LucideIcon;
  tone: Tone;
}

// Action types the API writes (shop_back: UserLogHelper.LogAsync callers).
const ACTIONS: Record<string, ActionMeta> = {
  create: { label: 'Create', verb: 'created', icon: Plus, tone: 'success' },
  update: { label: 'Update', verb: 'updated', icon: Pencil, tone: 'info' },
  delete: { label: 'Delete', verb: 'deleted', icon: Trash2, tone: 'destructive' },
  bulkdelete: { label: 'Bulk delete', verb: 'deleted several', icon: Trash2, tone: 'destructive' },
  deleteblocked: { label: 'Delete blocked', verb: 'was blocked from deleting', icon: Ban, tone: 'warning' },
  restore: { label: 'Restore', verb: 'restored', icon: RotateCcw, tone: 'warning' },
  bulkrestore: { label: 'Bulk restore', verb: 'restored several', icon: RotateCcw, tone: 'warning' },
  reset: { label: 'Reset', verb: 'reset', icon: KeyRound, tone: 'warning' },
  login: { label: 'Sign in', verb: 'signed in', icon: LogIn, tone: 'primary' },
  logout: { label: 'Sign out', verb: 'signed out', icon: LogOut, tone: 'muted' },
  logoutalldevices: { label: 'Sign out everywhere', verb: 'signed out of all devices', icon: LogOut, tone: 'muted' },
  logoutotherdevices: { label: 'Sign out others', verb: 'signed out of other devices', icon: LogOut, tone: 'muted' },
};

export const actionOf = (type: string): ActionMeta =>
  ACTIONS[(type || '').toLowerCase()] ?? { label: type || 'Activity', verb: (type || 'did something').toLowerCase(), icon: Activity, tone: 'muted' };

/** Actions about the session rather than a record ("signed in", not "updated User"). */
export const isSessionAction = (type: string) => /^(login|logout)/i.test(type || '');

export const toneSoft: Record<Tone, string> = {
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  primary: 'bg-primary/10 text-primary',
  muted: 'bg-muted text-muted-foreground',
};

/** Quick filters above the list; each maps to the action types it covers. */
export const QUICK_FILTERS: { id: string; label: string; types: string[] }[] = [
  { id: 'all', label: 'All', types: [] },
  { id: 'create', label: 'Created', types: ['Create'] },
  { id: 'update', label: 'Updated', types: ['Update'] },
  { id: 'delete', label: 'Deleted', types: ['Delete', 'BulkDelete', 'DeleteBlocked'] },
  { id: 'restore', label: 'Restored', types: ['Restore', 'BulkRestore'] },
  { id: 'session', label: 'Sign-ins', types: ['Login', 'Logout', 'LogoutAllDevices', 'LogoutOtherDevices'] },
];

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
  /** The field had no earlier value recorded (e.g. on create). */
  isNew: boolean;
}

/**
 * The API stores changes as {"before": {...}, "after": {...changed fields}}.
 * Older or hand-written entries may be any JSON; those come back as `raw`.
 */
export function diffOf(changes?: string | null): { fields: FieldChange[]; raw?: unknown } {
  const parsed = parseChanges(changes ?? undefined);
  if (!parsed) return { fields: [] };
  const before = parsed.before;
  const after = parsed.after;
  if (after && typeof after === 'object' && !Array.isArray(after)) {
    const prev = before && typeof before === 'object' ? (before as Record<string, unknown>) : {};
    return {
      fields: Object.entries(after as Record<string, unknown>).map(([field, value]) => ({
        field,
        before: prev[field],
        after: value,
        isNew: !(field in prev),
      })),
    };
  }
  return { fields: [], raw: parsed };
}

export const showValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/** "passwordHash" → "Password hash". */
export const humanize = (field: string) =>
  field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\b(\w)(\w*)/g, (m, a, b, i) => (i === 0 ? m : a.toLowerCase() + b));
