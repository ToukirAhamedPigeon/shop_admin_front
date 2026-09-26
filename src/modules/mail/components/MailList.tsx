// src/modules/mail/components/MailList.tsx
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { format } from 'date-fns';
import {
  Star,
  Mail as MailIcon,
  MailOpen,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { dispatchShowToast } from '@/lib/dispatch';
import { getMails, bulkMailAction, toggleStar, markAsRead } from '../api';
import type { Mail, MailboxType, MailFilterRequest } from '../types';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import Loader from '@/components/custom/Loader';
import { capitalize } from '@/lib/helpers';
import { useDebounce } from '@/hooks/useDebounce';

interface MailListProps {
  mailbox: MailboxType;
  onSelectMail: (mail: Mail) => void;
  selectedMail: Mail | null;
  onRefreshList: () => void;
  onRefreshStatistics: () => void;
  isMobile?: boolean;
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

const getSenderColumnHeader = (mailbox: MailboxType): string => {
  switch (mailbox) {
    case 'sent': return 'To';
    case 'inbox': return 'From';
    default: return 'From/To';
  }
};

const SearchInputComponent = memo(({
  value,
  onChange,
  placeholder,
  isMobile
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isMobile?: boolean;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative flex-1 group">
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className={cn(
          "w-full rounded-xl shadow-sm transition-colors duration-200 focus-visible:ring-primary/40 focus-visible:border-primary",
          isMobile ? "pl-8 text-sm h-9" : "pl-10 h-10"
        )}
      />
      <svg
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary",
          isMobile ? "left-2.5" : "left-3"
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
});

SearchInputComponent.displayName = 'SearchInputComponent';

const EmailTable = memo(({
  mails,
  mailbox,
  selectedMail,
  selectedIds,
  onMailClick,
  onStarClick,
  onSelectAll,
  loading,
  isMobile
}: {
  mails: Mail[];
  mailbox: MailboxType;
  selectedMail: Mail | null;
  selectedIds: Set<number>;
  onMailClick: (mail: Mail) => void;
  onStarClick: (e: React.MouseEvent, mail: Mail) => void;
  onSelectChange: (id: number, checked: boolean | string) => void;
  onSelectAll: (checked: boolean | string) => void;
  loading: boolean;
  isMobile?: boolean;
}) => {
  const senderColumnHeader = getSenderColumnHeader(mailbox);

  return (
    <div className="flex-1 overflow-auto relative" style={{ maxHeight: isMobile ? 'calc(100vh - 420px)' : 'calc(100vh - 380px)', minHeight: '200px' }}>
      {loading && mails.length > 0 && (
        <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-md">
            <Loader type="bars" size={32} />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border bg-muted">
              <th className="px-2 py-3 sm:px-4 text-center w-8 sm:w-10">
                <div
                  className="flex justify-center cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAll(selectedIds.size !== mails.length);
                  }}
                >
                  <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                    selectedIds.size === mails.length && mails.length > 0
                      ? 'bg-primary border-primary'
                      : selectedIds.size > 0
                        ? 'bg-primary/20 border-primary/50'
                        : 'border-border bg-background hover:border-primary/60'
                  }`}>
                    {selectedIds.size === mails.length && mails.length > 0 && (
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {selectedIds.size > 0 && selectedIds.size !== mails.length && (
                      <div className="w-1.5 h-0.5 bg-primary" />
                    )}
                  </div>
                </div>
              </th>
              <th className="px-2 py-3 sm:px-4 text-center w-8 sm:w-10"></th>
              <th className="px-2 py-3 sm:px-4 text-center w-8 sm:w-10"></th>
              <th className={cn(
                "px-2 py-3 sm:px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                isMobile ? "" : ""
              )}>{isMobile ? senderColumnHeader.slice(0, 1) : senderColumnHeader}</th>
              <th className={cn(
                "px-2 py-3 sm:px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                isMobile ? "" : ""
              )}>{isMobile ? 'Subj' : 'Subject'}</th>
              <th className={cn(
                "px-2 py-3 sm:px-4 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground",
                isMobile ? "text-xs w-20" : "text-sm w-32"
              )}>{isMobile ? 'Date' : 'Date'}</th>
            </tr>
          </thead>
          <tbody>
            {mails.length === 0 ? (
              <tr className="border-b border-border">
                <td colSpan={6} className="p-4 text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MailIcon className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/50" />
                    <p className="text-sm sm:text-base">No messages in {mailbox}</p>
                  </div>
                </td>
              </tr>
            ) : (
              mails.map((mail, index) => (
                <tr
                  key={mail.id}
                  onClick={() => onMailClick(mail)}
                  className={cn(
                    "transition-colors duration-150 cursor-pointer",
                    "border-b border-border",
                    index !== mails.length - 1 && "border-b",
                    selectedMail?.id === mail.id && "bg-primary/10",
                    !mail.isRead && !mail.isSent && "bg-primary/5",
                    !selectedMail || selectedMail?.id !== mail.id && "hover:bg-muted/50"
                  )}
                >
                  <td className="px-2 py-2.5 sm:px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <div className="cursor-pointer group">
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                          selectedIds.has(mail.id)
                            ? 'bg-primary border-primary'
                            : 'border-border bg-background hover:border-primary/60'
                        }`}>
                          {selectedIds.has(mail.id) && (
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 sm:px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => onStarClick(e, mail)}
                      className="focus:outline-none cursor-pointer group transition-colors duration-150"
                    >
                      <Star className={cn(
                        "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200",
                        mail.isStarred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400 group-hover:text-yellow-400"
                      )} />
                    </button>
                  </td>
                  <td className="px-2 py-2.5 sm:px-4 text-center">
                    {!mail.isRead && !mail.isSent ? (
                      <MailOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    ) : (
                      <MailIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className={cn(
                    "px-2 py-2.5 sm:px-4 text-foreground",
                    !mail.isRead && !mail.isSent ? "font-semibold" : "",
                    isMobile ? "text-xs max-w-[60px] truncate" : "text-sm"
                  )}>
                    {isMobile ? getSenderDisplay(mail, mailbox).slice(0, 10) : getSenderDisplay(mail, mailbox)}
                  </td>
                  <td className={cn(
                    "px-2 py-2.5 sm:px-4 text-foreground",
                    !mail.isRead && !mail.isSent ? "font-semibold" : "",
                    isMobile ? "text-xs max-w-[80px] truncate" : "text-sm max-w-[300px] truncate"
                  )}>
                    {isMobile ? mail.subject.slice(0, 15) : mail.subject}
                  </td>
                  <td className="px-2 py-2.5 sm:px-4 text-muted-foreground text-xs sm:text-sm whitespace-nowrap text-center tabular-nums">
                    {isMobile ? format(new Date(mail.createdAt), 'MM/dd/yy') : format(new Date(mail.createdAt), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
  isMobile = false
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

  const isInitialMount = useRef(true);
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
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadMails();
    } else {
      loadMails();
    }
  }, [loadMails]);

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
      onRefreshList();
      onRefreshStatistics();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: `Bulk ${actionDialog.action} failed` });
    } finally {
      setBulkActionLoading(false);
      setActionDialog(null);
    }
  }, [actionDialog, onRefreshList, onRefreshStatistics]);

  const selectedCount = selectedIds.size;

  if (loading && mails.length === 0) {
    return (
      <div className="flex-1 rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center">
        <Loader type="circular" size={isMobile ? 32 : 48} />
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-xl overflow-hidden flex flex-col relative bg-card border border-border shadow-sm">
      <div className="relative z-10 p-2 sm:p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <SearchInputComponent
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search emails..."
            isMobile={isMobile}
          />
          {selectedCount > 0 && (
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {!isTrashView ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('trash')}
                  className={cn(isMobile ? "text-xs px-2 py-1" : "")}
                >
                  <Trash2 className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-0.5" : "mr-1")} />
                  {!isMobile && `Trash (${selectedCount})`}
                  {isMobile && selectedCount}
                </Button>
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleBulkAction('restore')}
                    className={cn(isMobile ? "text-xs px-2 py-1" : "")}
                  >
                    <RotateCcw className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-0.5" : "mr-1")} />
                    {!isMobile && `Restore (${selectedCount})`}
                    {isMobile && selectedCount}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className={cn(isMobile ? "text-xs px-2 py-1" : "")}
                  >
                    <Trash2 className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-0.5" : "mr-1")} />
                    {!isMobile && `Delete (${selectedCount})`}
                    {isMobile && selectedCount}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <EmailTable
        mails={mails}
        mailbox={mailbox}
        selectedMail={selectedMail}
        selectedIds={selectedIds}
        onMailClick={handleMailClick}
        onStarClick={handleStarClick}
        onSelectChange={handleSelectChange}
        onSelectAll={handleSelectAll}
        loading={loading}
        isMobile={isMobile}
      />

      {/* Pagination - Always visible if totalCount > ITEMS_PER_PAGE */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="relative z-10 p-2 sm:p-4 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">
              {isMobile
                ? `${((page - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(page * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
                : `Showing ${((page - 1) * ITEMS_PER_PAGE) + 1} - ${Math.min(page * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
              }
            </span>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(isMobile ? "text-xs px-2 py-1" : "")}
              >
                <ChevronLeft className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-0.5" : "mr-1")} />
                {!isMobile && "Previous"}
              </Button>
              <span className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm text-muted-foreground bg-muted rounded-lg">
                {isMobile ? `${page}/${Math.ceil(totalCount / ITEMS_PER_PAGE)}` : `Page ${page} of ${Math.ceil(totalCount / ITEMS_PER_PAGE)}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))}
                disabled={page === Math.ceil(totalCount / ITEMS_PER_PAGE)}
                className={cn(isMobile ? "text-xs px-2 py-1" : "")}
              >
                {!isMobile && "Next"}
                <ChevronRight className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "ml-0.5" : "ml-1")} />
              </Button>
            </div>
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