// src/modules/mail/components/MailReader.tsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  X,
  Star,
  Reply,
  Trash2,
  RotateCcw,
  MailOpen,
  Mail as MailIcon,
  ChevronUp,
  ChevronDown,
  Paperclip,
  Download,
  File,
  Image,
  FileText,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  Archive,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import { cn } from '@/lib/utils';
import { dispatchShowToast } from '@/lib/dispatch';
import { getMailById, toggleStar, moveToTrash, markAsRead, markAsUnread, bulkMailAction } from '../api';
import type { Mail, MailboxType, MailDetail } from '../types';
import { initialsOf } from './mailFormat';

interface MailReaderProps {
  mailId: number;
  mailbox: MailboxType;
  /** `pane`: beside the list (shows ✕). `page`: replaces the list (shows ←). */
  variant: 'pane' | 'page';
  onClose: () => void;
  onReply: (mail: Mail) => void;
  /** A field changed here (read, star); the list row should follow. */
  onChange: (id: number, changes: Partial<Mail>) => void;
  /** The mail left this folder (trashed, restored or deleted). */
  onRemoved: (id: number) => void;
  onStatisticsChange: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position?: { index: number; total: number };
}

// Remote storage URL from environment
const REMOTE_STORAGE_URL = import.meta.env.VITE_REMOTE_STORAGE_URL || 'https://shopfiles.pigeonic.com';

// Full URL for an attachment (stored paths are relative to the file server).
const getFullFileUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${REMOTE_STORAGE_URL}${url}`;
  return url;
};

// File name without the upload's timestamp prefix (timestamp_filename.ext).
const getFileNameFromUrl = (url: string): string => {
  try {
    const fileName = new URL(getFullFileUrl(url)).pathname.split('/').pop() || '';
    const parts = fileName.split('_');
    if (parts.length > 1 && /^\d+$/.test(parts[0])) return parts.slice(1).join('_');
    return decodeURIComponent(fileName);
  } catch {
    return url.split('/').pop() || 'Unknown';
  }
};

const getFileExtension = (fileName: string) => (fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '');

const fileIcon = (ext: string): LucideIcon => {
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(ext)) return Image;
  if (['pdf', 'doc', 'docx', 'txt', 'html', 'htm', 'css', 'js', 'json', 'xml', 'md'].includes(ext)) return FileText;
  if (['xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) return FileSpreadsheet;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return Archive;
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return FileAudio;
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) return FileVideo;
  return File;
};

const fullDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : format(d, 'EEE, MMM d, yyyy, h:mm a');
};

const IconButton = ({
  label,
  onClick,
  disabled,
  pressed,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    aria-pressed={pressed}
    className={cn(
      'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors',
      'hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
      className
    )}
  >
    {children}
  </button>
);

function ReaderSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6" aria-hidden>
      <div className="h-6 w-3/4 rounded-md bg-muted" />
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-40 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-2.5">
        {[100, 96, 88, 92, 60].map((w, i) => (
          <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

/** One message, shown beside the list (split view) or in its place. */
export default function MailReader({
  mailId,
  mailbox,
  variant,
  onClose,
  onReply,
  onChange,
  onRemoved,
  onStatisticsChange,
  onPrev,
  onNext,
  position,
}: MailReaderProps) {
  const [mail, setMail] = useState<MailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showAllAttachments, setShowAllAttachments] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest callbacks without refetching when the parent re-renders.
  const onChangeRef = useRef(onChange);
  const onStatsRef = useRef(onStatisticsChange);
  onChangeRef.current = onChange;
  onStatsRef.current = onStatisticsChange;

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setFailed(false);
    setShowAllAttachments(false);
    scrollRef.current?.scrollTo({ top: 0 });

    getMailById(mailId)
      .then(({ data }) => {
        if (stale) return;
        setMail(data);
        // Opening a received message reads it (the list may already have done so).
        if (!data.isRead && !data.isSent) {
          setMail({ ...data, isRead: true });
          onChangeRef.current(data.id, { isRead: true });
          markAsRead(data.id)
            .then(() => onStatsRef.current())
            .catch(console.error);
        }
      })
      .catch((error) => {
        if (stale) return;
        console.error('Failed to load mail:', error);
        setMail(null);
        setFailed(true);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [mailId, attempt]);

  const update = (changes: Partial<Mail>) => {
    setMail((prev) => (prev ? { ...prev, ...changes } : prev));
    onChange(mailId, changes);
  };

  const handleToggleStar = async () => {
    if (!mail) return;
    const starred = mail.isStarred;
    update({ isStarred: !starred });
    try {
      await toggleStar(mail.id);
      onStatisticsChange();
    } catch {
      update({ isStarred: starred });
      dispatchShowToast({ type: 'danger', message: 'Failed to update star status' });
    }
  };

  const handleToggleRead = async () => {
    if (!mail) return;
    const read = mail.isRead;
    update({ isRead: !read });
    try {
      await (read ? markAsUnread(mail.id) : markAsRead(mail.id));
      onStatisticsChange();
    } catch {
      update({ isRead: read });
      dispatchShowToast({ type: 'danger', message: 'Failed to update read status' });
    }
  };

  const leaveFolder = async (run: () => Promise<unknown>, done: string, failedMsg: string) => {
    if (!mail) return;
    setBusy(true);
    try {
      await run();
      dispatchShowToast({ type: 'success', message: done });
      onStatisticsChange();
      onRemoved(mail.id);
    } catch {
      dispatchShowToast({ type: 'danger', message: failedMsg });
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const isTrash = mailbox === 'trash';
  const attachments = mail?.attachments ?? [];
  const visibleAttachments = showAllAttachments ? attachments : attachments.slice(0, 6);
  const sender = mail ? (mail.isSent ? mail.toMail : mail.fromMail) : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border p-2 sm:px-3">
        <IconButton label={variant === 'page' ? 'Back to list' : 'Close'} onClick={onClose}>
          {variant === 'page' ? <ArrowLeft className="size-[18px]" /> : <X className="size-[18px]" />}
        </IconButton>
        <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        {isTrash ? (
          <>
            <IconButton
              label="Restore"
              disabled={!mail || busy}
              onClick={() => leaveFolder(() => bulkMailAction([mailId], 'restore'), 'Restored', 'Failed to restore')}
            >
              <RotateCcw className="size-[18px]" />
            </IconButton>
            <IconButton label="Delete forever" disabled={!mail || busy} onClick={() => setConfirmDelete(true)} className="hover:text-destructive">
              <Trash2 className="size-[18px]" />
            </IconButton>
          </>
        ) : (
          <IconButton
            label="Move to trash"
            disabled={!mail || busy}
            onClick={() => leaveFolder(() => moveToTrash(mailId), 'Moved to trash', 'Failed to move to trash')}
            className="hover:text-destructive"
          >
            <Trash2 className="size-[18px]" />
          </IconButton>
        )}
        {mail && !mail.isSent && (
          <IconButton label={mail.isRead ? 'Mark as unread' : 'Mark as read'} onClick={handleToggleRead}>
            {mail.isRead ? <MailIcon className="size-[18px]" /> : <MailOpen className="size-[18px]" />}
          </IconButton>
        )}
        <IconButton label={mail?.isStarred ? 'Unstar' : 'Star'} pressed={!!mail?.isStarred} disabled={!mail} onClick={handleToggleStar}>
          <Star className={cn('size-[18px]', mail?.isStarred && 'fill-warning text-warning')} />
        </IconButton>

        <div className="ml-auto flex items-center gap-0.5">
          {position && position.total > 1 && (
            <span className="mr-1 hidden text-xs text-muted-foreground tabular-nums sm:inline">
              {position.index + 1} of {position.total}
            </span>
          )}
          <IconButton label="Newer (k)" disabled={!onPrev} onClick={() => onPrev?.()}>
            <ChevronUp className="size-[18px]" />
          </IconButton>
          <IconButton label="Older (j)" disabled={!onNext} onClick={() => onNext?.()}>
            <ChevronDown className="size-[18px]" />
          </IconButton>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {loading && !mail ? (
          <ReaderSkeleton />
        ) : failed || !mail ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <p className="text-sm font-medium text-foreground">This message couldn't be loaded</p>
            <Button variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
          </div>
        ) : (
          <motion.article
            key={mail.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn('px-4 py-5 sm:px-6', loading && 'opacity-60 transition-opacity')}
            aria-busy={loading}
          >
            <h2 className="text-lg font-semibold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-xl">
              {mail.subject || '(no subject)'}
            </h2>
            {mail.mailType && (
              <span className="mt-2 inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {mail.mailType}
              </span>
            )}

            {/* Sender */}
            <div className="mt-5 flex items-start gap-3">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              >
                {initialsOf(sender)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="min-w-0 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{mail.fromMail}</p>
                  <time dateTime={mail.createdAt} className="shrink-0 text-xs text-muted-foreground">
                    {fullDate(mail.createdAt)}
                  </time>
                </div>
                <dl className="mt-0.5 space-y-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  <div className="flex gap-1">
                    <dt>to</dt>
                    <dd className="text-foreground/80">{mail.toMail}</dd>
                  </div>
                  {mail.ccMail && (
                    <div className="flex gap-1">
                      <dt>cc</dt>
                      <dd className="text-foreground/80">{mail.ccMail}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Body */}
            <div
              className="markdown-body mt-6 max-w-none [overflow-wrap:anywhere]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mail.body) }}
            />

            {/* Attachments */}
            {attachments.length > 0 && (
              <section className="mt-8 border-t border-border pt-5" aria-label="Attachments">
                <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Paperclip className="size-4 text-muted-foreground" />
                  {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
                  {visibleAttachments.map((attachment, index) => {
                    const url = getFullFileUrl(attachment);
                    const name = getFileNameFromUrl(attachment);
                    const ext = getFileExtension(name);
                    const Icon = fileIcon(ext);
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={name}
                        className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 outline-none transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">{name}</span>
                          {ext && <span className="block text-[11px] uppercase text-muted-foreground">{ext}</span>}
                        </span>
                        <Download className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </a>
                    );
                  })}
                </div>
                {attachments.length > 6 && !showAllAttachments && (
                  <Button variant="link" size="sm" onClick={() => setShowAllAttachments(true)} className="mt-1 px-0">
                    Show all ({attachments.length - 6} more)
                  </Button>
                )}
              </section>
            )}

            {/* Replies */}
            {mail.replies?.length > 0 && (
              <section className="mt-8 border-t border-border pt-5" aria-label="Replies">
                <p className="mb-3 text-sm font-medium text-foreground">
                  {mail.replies.length} repl{mail.replies.length > 1 ? 'ies' : 'y'}
                </p>
                <ol className="space-y-3">
                  {mail.replies.map((reply) => (
                    <li key={reply.id} className="rounded-xl border border-border bg-muted/40 p-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                        <span className="min-w-0 font-medium text-foreground [overflow-wrap:anywhere]">{reply.fromMail}</span>
                        <time dateTime={reply.createdAt} className="text-xs text-muted-foreground">
                          {fullDate(reply.createdAt)}
                        </time>
                      </div>
                      <div
                        className="markdown-body mt-2 max-w-none text-sm [overflow-wrap:anywhere]"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.body) }}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {!mail.isSent && (
              <div className="mt-8">
                <Button variant="outline" onClick={() => onReply(mail)} className="rounded-full px-5">
                  <Reply className="size-4" />
                  Reply
                </Button>
              </div>
            )}
          </motion.article>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => leaveFolder(() => bulkMailAction([mailId], 'delete'), 'Deleted forever', 'Failed to delete')}
        title="Delete forever"
        variant="destructive"
        confirmLabel="Delete"
        loading={busy}
      >
        <p>This message will be deleted permanently. This can't be undone.</p>
      </ConfirmDialog>
    </div>
  );
}
