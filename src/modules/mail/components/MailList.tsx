// src/modules/mail/components/MailList.tsx
import { useState, useEffect, useCallback, useImperativeHandle, useRef, memo, type Ref } from 'react';
import { format, isThisYear, isToday } from 'date-fns';
import {
  Star,
  Inbox,
  Paperclip,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dispatchShowToast } from '@/lib/dispatch';
import { getMails, bulkMailAction, toggleStar, markAsRead } from '../api';
import type { Mail, MailboxType, MailFilterRequest } from '../types';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import Loader from '@/components/custom/Loader';
import { capitalize } from '@/lib/helpers';
import { useDebounce } from '@/hooks/useDebounce';
import { initialsOf } from './mailFormat';

interface MailListProps {
  mailbox: MailboxType;
  onSelectMail: (mail: Mail) => void;
  selectedMail: Mail | null;
  onRefreshList: () => void;
  onRefreshStatistics: () => void;
  /** Called with the rows on screen, so the reader can step to the next one. */
  onMailsChange?: (mails: Mail[]) => void;
  /** Called after a bulk action takes messages out of this folder. */
  onRemoved?: (ids: number[]) => void;
  /** Lets the reader update or drop a row without reloading the page of results. */
  ref?: Ref<MailListHandle>;
}

export interface MailListHandle {
  patch: (id: number, changes: Partial<Mail>) => void;
  remove: (id: number) => void;
}

const ITEMS_PER_PAGE = 20;

const getSenderDisplay = (mail: Mail, mailbox: MailboxType): string => {
  switch (mailbox) {
    case 'sent':
      return mail.toMail;
    case 'inbox':
      return mail.fromMail;
    case 'starred':
    case 'trash':
    default:
      return mail.isSent ? mail.toMail : mail.fromMail;
  }
};

// Short, scannable date: time for today, day and month this year, full date before.
const shortDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (isToday(d)) return format(d, 'h:mm a');
  if (isThisYear(d)) return format(d, 'MMM d');
  return format(d, 'dd/MM/yy');
};

// Plain-text preview of an HTML body. DOMParser builds an inert document
// (no scripts run, nothing is inserted into the page).
const previewCache = new Map<number, string>();
const previewOf = (mail: Mail) => {
  const cached = previewCache.get(mail.id);
  if (cached !== undefined) return cached;
  const text = (new DOMParser().parseFromString(mail.body || '', 'text/html').body.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  previewCache.set(mail.id, text);
  return text;
};

const SearchInputComponent = memo(({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        placeholder={placeholder}
        value={localValue}
        aria-label={placeholder}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange(e.target.value);
        }}
        className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />
    </div>
  );
});

SearchInputComponent.displayName = 'SearchInputComponent';

const Checkbox = ({ checked, partial, onToggle, label }: { checked: boolean; partial?: boolean; onToggle: () => void; label: string }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={partial ? 'mixed' : checked}
    aria-label={label}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span
      className={cn(
        'flex size-4 items-center justify-center rounded border-2 transition-colors',
        checked ? 'border-primary bg-primary' : partial ? 'border-primary/60 bg-primary/20' : 'border-border bg-background hover:border-primary/60'
      )}
    >
      {checked && (
        <svg className="size-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {partial && !checked && <span className="h-0.5 w-1.5 bg-primary" />}
    </span>
  </button>
);

/** Message rows, email-client style: works the same on phones and desktops. */
const EmailTable = memo(({
  mails,
  mailbox,
  selectedMail,
  selectedIds,
  onMailClick,
  onStarClick,
  onSelectChange,
  loading,
}: {
  mails: Mail[];
  mailbox: MailboxType;
  selectedMail: Mail | null;
  selectedIds: Set<number>;
  onMailClick: (mail: Mail) => void;
  onStarClick: (e: React.MouseEvent, mail: Mail) => void;
  onSelectChange: (id: number, checked: boolean | string) => void;
  loading: boolean;
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const activeId = selectedMail?.id;

  // Keep the open message in view when stepping through with j / k.
  useEffect(() => {
    if (activeId === undefined) return;
    listRef.current?.querySelector(`[data-mail-id="${activeId}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  if (mails.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Inbox className="size-7" />
        </span>
        <p className="text-base font-medium text-foreground">No messages in {mailbox}</p>
        <p className="max-w-xs text-sm text-muted-foreground">New mail will show up here. Try another folder or clear your search.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center bg-background/50 pt-16">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-md">
            <Loader type="bars" size={28} />
          </div>
        </div>
      )}
      <ul ref={listRef} role="list" className="divide-y divide-border">
        {mails.map((mail) => {
          const unread = !mail.isRead && !mail.isSent;
          const selected = selectedIds.has(mail.id);
          const active = selectedMail?.id === mail.id;
          const who = getSenderDisplay(mail, mailbox);
          const prefix = mail.isSent && mailbox !== 'sent' ? 'To: ' : mailbox === 'sent' ? 'To: ' : '';
          return (
            <li
              key={mail.id}
              onClick={() => onMailClick(mail)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onMailClick(mail);
                }
              }}
              tabIndex={0}
              data-mail-id={mail.id}
              aria-current={active ? 'true' : undefined}
              aria-label={`${unread ? 'Unread, ' : ''}${who}: ${mail.subject}`}
              className={cn(
                'group relative flex cursor-pointer items-start gap-1 py-2.5 pl-1.5 pr-3 outline-none transition-colors sm:gap-2 sm:pl-2 sm:pr-4',
                'focus-visible:bg-accent',
                active ? 'bg-primary/[0.11]' : selected ? 'bg-primary/[0.07]' : unread ? 'bg-primary/[0.03] hover:bg-accent' : 'hover:bg-accent'
              )}
            >
              {unread && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-primary" />}
              <div className="flex shrink-0 items-center">
                <Checkbox checked={selected} onToggle={() => onSelectChange(mail.id, !selected)} label={`Select ${mail.subject}`} />
                <button
                  type="button"
                  onClick={(e) => onStarClick(e, mail)}
                  aria-label={mail.isStarred ? 'Unstar' : 'Star'}
                  aria-pressed={mail.isStarred}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    className={cn(
                      'size-4 transition-colors',
                      mail.isStarred ? 'fill-warning text-warning' : 'text-muted-foreground/60 group-hover:text-muted-foreground hover:!text-warning'
                    )}
                  />
                </button>
              </div>
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 hidden size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:flex',
                  unread ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                )}
              >
                {initialsOf(who)}
              </span>
              <div className="min-w-0 flex-1 pl-1 sm:pl-2">
                <div className="flex items-baseline gap-2">
                  <p className={cn('min-w-0 flex-1 truncate text-sm', unread ? 'font-semibold text-foreground' : 'text-foreground/85')}>
                    <span className="text-muted-foreground">{prefix}</span>
                    {who}
                  </p>
                  {mail.attachments?.length > 0 && <Paperclip aria-label="Has attachments" className="size-3.5 shrink-0 text-muted-foreground" />}
                  <time
                    dateTime={mail.createdAt}
                    className={cn('shrink-0 text-xs tabular-nums', unread ? 'font-semibold text-primary' : 'text-muted-foreground')}
                  >
                    {shortDate(mail.createdAt)}
                  </time>
                </div>
                <p className={cn('truncate text-sm', unread ? 'font-medium text-foreground' : 'text-foreground/80')}>
                  {mail.subject || '(no subject)'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{previewOf(mail)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

EmailTable.displayName = 'EmailTable';

export default function MailList({
  mailbox,
  onSelectMail,
  selectedMail,
  onRefreshList,
  onRefreshStatistics,
  onMailsChange,
  onRemoved,
  ref,
}: MailListProps) {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; ids: number[] } | null>(null);

  const debouncedSearch = useDebounce(searchValue, 500);

  const isTrashView = mailbox === 'trash';

  const loadMails = useCallback(async () => {
    setLoading(true);
    try {
      const request: MailFilterRequest = {
        page,
        limit: ITEMS_PER_PAGE,
        mailbox,
        q: debouncedSearch || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const response = await getMails(request);
      setMails(response.data.mails);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Failed to load mails:', error);
      dispatchShowToast({ type: 'danger', message: 'Failed to load emails' });
    } finally {
      setLoading(false);
    }
  }, [page, mailbox, debouncedSearch]);

  useEffect(() => {
    loadMails();
  }, [loadMails]);

  useEffect(() => {
    onMailsChange?.(mails);
  }, [mails, onMailsChange]);

  useImperativeHandle(ref, () => ({
    patch: (id, changes) => setMails((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m))),
    remove: (id) => {
      setMails((prev) => prev.filter((m) => m.id !== id));
      setTotalCount((n) => Math.max(0, n - 1));
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  }), []);

  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
    setSearchValue('');
  }, [mailbox]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const handleStarClick = useCallback(async (e: React.MouseEvent, mail: Mail) => {
    e.stopPropagation();
    const originalStarred = mail.isStarred;

    setMails(prevMails =>
      prevMails.map(m => m.id === mail.id ? { ...m, isStarred: !m.isStarred } : m)
    );

    try {
      await toggleStar(mail.id);
      onRefreshStatistics();
    } catch (error) {
      setMails(prevMails =>
        prevMails.map(m => m.id === mail.id ? { ...m, isStarred: originalStarred } : m)
      );
      dispatchShowToast({ type: 'danger', message: 'Failed to update star status' });
    }
  }, [onRefreshStatistics]);

  const handleMailClick = useCallback((mail: Mail) => {
    if (!mail.isRead && !mail.isSent) {
      setMails(prevMails =>
        prevMails.map(m => m.id === mail.id ? { ...m, isRead: true } : m)
      );
      markAsRead(mail.id).catch(console.error);
      onRefreshStatistics();
    }
    onSelectMail(mail);
  }, [onSelectMail, onRefreshStatistics]);

  const handleSelectChange = useCallback((id: number, checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'true';
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'true';
    if (isChecked) {
      setSelectedIds(new Set(mails.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [mails]);

  const handleBulkAction = useCallback(async (action: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setActionDialog({ open: true, action, ids });
  }, [selectedIds]);

  const executeBulkAction = useCallback(async () => {
    if (!actionDialog) return;

    setBulkActionLoading(true);
    try {
      await bulkMailAction(actionDialog.ids, actionDialog.action);
      dispatchShowToast({ type: 'success', message: `Bulk ${actionDialog.action} completed` });
      setSelectedIds(new Set());
      if (actionDialog.action !== 'read' && actionDialog.action !== 'unread') onRemoved?.(actionDialog.ids);
      onRefreshList();
      onRefreshStatistics();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: `Bulk ${actionDialog.action} failed` });
    } finally {
      setBulkActionLoading(false);
      setActionDialog(null);
    }
  }, [actionDialog, onRefreshList, onRefreshStatistics, onRemoved]);

  const selectedCount = selectedIds.size;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const allSelected = mails.length > 0 && selectedCount === mails.length;

  if (loading && mails.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader type="circular" size={40} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Toolbar: select all, search, and bulk actions for the selection. */}
      <div className="flex items-center gap-1 border-b border-border p-2 sm:gap-2 sm:p-3">
        <div className="pl-0 sm:pl-0.5">
          <Checkbox
            checked={allSelected}
            partial={selectedCount > 0 && !allSelected}
            onToggle={() => handleSelectAll(!allSelected)}
            label={allSelected ? 'Clear selection' : 'Select all on this page'}
          />
        </div>
        {selectedCount > 0 ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:justify-start">
            <span className="mr-auto text-sm font-medium text-foreground sm:mr-2">{selectedCount} selected</span>
            {!isTrashView ? (
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('trash')}>
                <Trash2 className="size-4" />
                <span className="hidden sm:inline">Move to trash</span>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('restore')}>
                  <RotateCcw className="size-4" />
                  <span className="hidden sm:inline">Restore</span>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">Delete forever</span>
                </Button>
              </>
            )}
          </div>
        ) : (
          <SearchInputComponent value={searchValue} onChange={handleSearchChange} placeholder="Search mail" />
        )}
      </div>

      <EmailTable
        mails={mails}
        mailbox={mailbox}
        selectedMail={selectedMail}
        selectedIds={selectedIds}
        onMailClick={handleMailClick}
        onStarClick={handleStarClick}
        onSelectChange={handleSelectChange}
        loading={loading}
      />

      {totalCount > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 sm:px-4">
          <span className="text-xs text-muted-foreground tabular-nums sm:text-sm">
            {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-12 text-center text-xs text-muted-foreground tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {actionDialog && (
        <ConfirmDialog
          open={actionDialog.open}
          onCancel={() => setActionDialog(null)}
          onConfirm={executeBulkAction}
          title={`Bulk ${capitalize(actionDialog.action)}`}
          variant={actionDialog.action === 'delete' ? 'destructive' : 'warning'}
          confirmLabel={capitalize(actionDialog.action)}
          loading={bulkActionLoading}
        >
          <p>Are you sure you want to {actionDialog.action} {actionDialog.ids.length} selected message(s)?</p>
        </ConfirmDialog>
      )}
    </div>
  );
}