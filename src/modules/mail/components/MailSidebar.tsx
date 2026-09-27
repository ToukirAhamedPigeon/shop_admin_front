// src/modules/mail/components/MailSidebar.tsx
import { cn } from '@/lib/utils';
import { Inbox, Send, Star, Trash2, PenSquare, MailOpen, type LucideIcon } from 'lucide-react';
import type { MailboxType, MailStatistics } from '../types';

interface MailSidebarProps {
  selectedMailbox: MailboxType;
  onSelectMailbox: (mailbox: MailboxType) => void;
  statistics: MailStatistics | null;
  onCompose: () => void;
  /** `rail`: vertical list (md+). `icons`: narrow icon rail (split view). `tabs`: folder chips (phones). */
  layout?: 'rail' | 'icons' | 'tabs';
}

const mailboxes: { id: MailboxType; label: string; icon: LucideIcon; countKey: keyof MailStatistics }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, countKey: 'totalReceived' },
  { id: 'starred', label: 'Starred', icon: Star, countKey: 'starredCount' },
  { id: 'sent', label: 'Sent', icon: Send, countKey: 'totalSent' },
  { id: 'trash', label: 'Trash', icon: Trash2, countKey: 'trashCount' },
];

const count = (n?: number) => (n === undefined ? '' : n > 999 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function MailSidebar({
  selectedMailbox,
  onSelectMailbox,
  statistics,
  onCompose,
  layout = 'rail',
}: MailSidebarProps) {
  if (layout === 'icons') {
    return (
      <div className="flex h-full flex-col items-center gap-3 py-3">
        <button
          type="button"
          onClick={onCompose}
          title="Compose"
          aria-label="Compose"
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 outline-none transition-shadow hover:shadow-xl hover:shadow-primary/30 focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <PenSquare className="size-[18px]" />
        </button>
        <nav aria-label="Mail folders" className="flex flex-col items-center gap-1">
          {mailboxes.map(({ id, label, icon: Icon, countKey }) => {
            const active = selectedMailbox === id;
            const n = statistics?.[countKey];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectMailbox(id)}
                aria-current={active ? 'page' : undefined}
                title={n === undefined ? label : `${label} (${n.toLocaleString()})`}
                aria-label={label}
                className={cn(
                  'relative flex size-10 cursor-pointer items-center justify-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="size-[18px]" />
                {id === 'inbox' && !!statistics?.unreadCount && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-4 text-primary-foreground tabular-nums">
                    {statistics.unreadCount > 99 ? '99+' : statistics.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  if (layout === 'tabs') {
    return (
      <nav aria-label="Mail folders" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {mailboxes.map(({ id, label, icon: Icon, countKey }) => {
          const active = selectedMailbox === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectMailbox(id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-foreground/80 hover:bg-accent'
              )}
            >
              <Icon className="size-4" />
              {label}
              {statistics && (
                <span className={cn('text-xs tabular-nums', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  {count(statistics[countKey])}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5 p-3">
      <button
        type="button"
        onClick={onCompose}
        className="login-shimmer group relative flex h-11 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <PenSquare className="size-4" />
        Compose
      </button>

      <nav aria-label="Mail folders" className="space-y-0.5">
        <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Folders</p>
        {mailboxes.map(({ id, label, icon: Icon, countKey }) => {
          const active = selectedMailbox === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectMailbox(id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active ? 'bg-primary/10 font-medium text-primary' : 'text-foreground/80 hover:bg-accent hover:text-foreground'
              )}
            >
              {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary" />}
              <Icon className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground')} />
              <span className="flex-1 text-left">{label}</span>
              {statistics && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums',
                    active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                  )}
                >
                  {count(statistics[countKey])}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {statistics && (
        <div className="mt-auto rounded-xl border border-border bg-muted/40 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MailOpen className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold tabular-nums text-foreground">{statistics.unreadCount.toLocaleString()} unread</p>
              <p className="text-xs text-muted-foreground">
                {(statistics.totalReceived + statistics.totalSent).toLocaleString()} messages in total
              </p>
            </div>
          </div>
          {statistics.totalReceived > 0 && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10" aria-hidden>
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(2, Math.min(100, (statistics.unreadCount / statistics.totalReceived) * 100))}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
