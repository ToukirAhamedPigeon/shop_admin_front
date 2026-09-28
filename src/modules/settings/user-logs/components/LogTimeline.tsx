// src/modules/settings/user-logs/components/LogTimeline.tsx
import { useMemo, useState } from 'react';
import { format, isThisYear, isToday, isYesterday } from 'date-fns';
import { ChevronDown, Globe, Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IUserLog } from '@/types';
import { actionOf, diffOf, humanize, isSessionAction, showValue, toneSoft } from './logMeta';

interface LogTimelineProps {
  logs: IUserLog[];
  onOpen: (log: IUserLog) => void;
}

const dayLabel = (d: Date) =>
  isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, isThisYear(d) ? 'EEEE, MMM d' : 'EEEE, MMM d, yyyy');

const known = (v?: string | null) => (v && v.toLowerCase() !== 'unknown' ? v : null);

/** Field-by-field before → after. */
export function ChangeDiff({ changes, compact = false }: { changes?: string | null; compact?: boolean }) {
  const { fields, raw } = diffOf(changes);
  if (raw !== undefined) {
    return (
      <pre className="max-h-64 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-xs text-foreground/85 whitespace-pre-wrap [overflow-wrap:anywhere]">
        {JSON.stringify(raw, null, 2)}
      </pre>
    );
  }
  if (fields.length === 0) return <p className="text-sm text-muted-foreground">No field values changed.</p>;
  return (
    <dl className={cn('divide-y divide-border overflow-hidden rounded-lg border border-border', compact && 'text-xs')}>
      {fields.map((f) => (
        <div key={f.field} className="grid gap-1 px-3 py-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-3">
          <dt className="font-medium text-foreground/85">{humanize(f.field)}</dt>
          <dd className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono text-[0.92em]">
            {!f.isNew && (
              <>
                <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive line-through decoration-destructive/40 [overflow-wrap:anywhere]">
                  {showValue(f.before)}
                </span>
                <span aria-hidden className="text-muted-foreground">
                  →
                </span>
              </>
            )}
            <span className="rounded bg-success/10 px-1.5 py-0.5 text-success [overflow-wrap:anywhere]">{showValue(f.after)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LogEntry({ log, onOpen }: { log: IUserLog; onOpen: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const action = actionOf(log.actionType);
  const Icon = action.icon;
  const at = new Date(log.createdAt);
  const { fields, raw } = useMemo(() => diffOf(log.changes), [log.changes]);
  const changeCount = raw !== undefined ? 1 : fields.length;
  const device = known(log.device);
  const DeviceIcon = device && /mobile|phone|tablet/i.test(device) ? Smartphone : Monitor;
  const client = [known(log.browser), known(log.operatingSystem)].filter(Boolean).join(' on ');

  return (
    <li className="group relative flex gap-3 py-3 pl-1 pr-2 sm:gap-4 sm:pr-3">
      {/* Rail */}
      <span aria-hidden className="absolute bottom-0 left-[21px] top-0 w-px bg-border group-first:top-5 group-last:bottom-auto group-last:h-5 sm:left-[21px]" />
      <span className={cn('relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card', toneSoft[action.tone])}>
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open log: ${log.createdByName} ${action.verb} ${log.modelName}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm text-foreground/85">
              <span className="font-semibold text-foreground">{log.createdByName || 'Someone'}</span> {action.verb}
              {!isSessionAction(log.actionType) && log.modelName && (
                <>
                  {' '}
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">{log.modelName}</span>
                </>
              )}
            </p>
            <time dateTime={log.createdAt} title={format(at, 'yyyy-MM-dd HH:mm:ss')} className="shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
              {format(at, 'HH:mm')}
            </time>
          </div>
          {log.detail && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">{log.detail}</p>}
        </button>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {log.modelId && !isSessionAction(log.actionType) && (
            <span className="max-w-full truncate font-mono text-[11px]" title={log.modelId}>
              #{log.modelId.length > 12 ? `${log.modelId.slice(0, 8)}…` : log.modelId}
            </span>
          )}
          {(device || client) && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <DeviceIcon className="size-3.5 shrink-0" />
              <span className="truncate">{client || device}</span>
            </span>
          )}
          {log.ipAddress && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <Globe className="size-3.5 shrink-0" />
              {log.ipAddress}
            </span>
          )}
          {changeCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {raw !== undefined ? 'Show data' : `${changeCount} field${changeCount > 1 ? 's' : ''} changed`}
              <ChevronDown className={cn('size-3.5 transition-transform duration-200', expanded && 'rotate-180')} />
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-2">
            <ChangeDiff changes={log.changes} compact />
          </div>
        )}
      </div>
    </li>
  );
}

/** Activity feed: entries grouped by day, newest first (as the API sorts them). */
export default function LogTimeline({ logs, onOpen }: LogTimelineProps) {
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: IUserLog[] }[] = [];
    for (const log of logs) {
      const d = new Date(log.createdAt);
      const key = Number.isNaN(d.getTime()) ? 'unknown' : format(d, 'yyyy-MM-dd');
      let group = out.find((g) => g.key === key);
      if (!group) {
        group = { key, label: key === 'unknown' ? 'Unknown date' : dayLabel(d), items: [] };
        out.push(group);
      }
      group.items.push(log);
    }
    return out;
  }, [logs]);

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h3 className="sticky top-0 z-20 -mx-1 mb-1 flex items-center gap-2 bg-card/95 px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
            {g.label}
            <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums">{g.items.length}</span>
          </h3>
          <ol>
            {g.items.map((log) => (
              <LogEntry key={log.id} log={log} onOpen={() => onOpen(log)} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-1" aria-hidden>
      <div className="h-3 w-24 rounded bg-muted" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex gap-4">
          <div className="size-9 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 rounded bg-muted" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
