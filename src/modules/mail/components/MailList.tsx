// src/modules/mail/components/MailList.tsx
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { format } from 'date-fns';
import { 
  Star, 
  Mail as MailIcon, 
  MailOpen, 
  Trash2, 
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { dispatchShowToast } from '@/lib/dispatch';
import { getMails, bulkMailAction, toggleStar, moveToTrash, markAsRead } from '../api';
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
}

const ITEMS_PER_PAGE = 20;

// Helper functions
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

// Separate component for the search input to prevent re-renders
const SearchInputComponent = memo(({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string;
}) => {
  // Use local state for immediate input feedback
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop changes (from reset)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  return (
    <Input
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      className="flex-1"
    />
  );
});

SearchInputComponent.displayName = 'SearchInputComponent';

// Separate component for the email list table to prevent re-renders of the search input
const EmailTable = memo(({ 
  mails, 
  mailbox, 
  selectedMail, 
  selectedIds, 
  onMailClick, 
  onStarClick, 
  onSelectChange, 
  onSelectAll,
  loading 
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
}) => {
  const senderColumnHeader = getSenderColumnHeader(mailbox);
  
  return (
    <div className="flex-1 overflow-auto relative">
      {loading && mails.length > 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 z-10 flex items-center justify-center">
          <Loader type="circular" size={32} />
        </div>
      )}
      <Table>
        <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-20">
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selectedIds.size === mails.length && mails.length > 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="w-10"></TableHead>
            <TableHead className="w-10"></TableHead>
            <TableHead>{senderColumnHeader}</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="w-32">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mails.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                No messages in {mailbox}
              </TableCell>
            </TableRow>
          ) : (
            mails.map((mail) => (
              <TableRow
                key={mail.id}
                onClick={() => onMailClick(mail)}
                className={cn(
                  "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                  selectedMail?.id === mail.id && "bg-primary/5",
                  !mail.isRead && !mail.isSent && "font-semibold bg-blue-50/30 dark:bg-blue-950/20"
                )}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(mail.id)}
                    onCheckedChange={(checked) => onSelectChange(mail.id, checked)}
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => onStarClick(e, mail)} className="focus:outline-none cursor-pointer">
                    <Star className={cn("w-4 h-4 transition-colors", mail.isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-400 hover:text-yellow-400")} />
                  </button>
                </TableCell>
                <TableCell>
                  {!mail.isRead && !mail.isSent ? (
                    <MailOpen className="w-4 h-4 text-blue-500" />
                  ) : (
                    <MailIcon className="w-4 h-4 text-gray-400" />
                  )}
                </TableCell>
                <TableCell className={cn(!mail.isRead && !mail.isSent ? "font-semibold" : "")}>
                  {getSenderDisplay(mail, mailbox)}
                </TableCell>
                <TableCell className={cn(!mail.isRead && !mail.isSent ? "font-semibold" : "")}>
                  {mail.subject}
                </TableCell>
                <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                  {format(new Date(mail.createdAt), 'MMM dd, yyyy')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
});

EmailTable.displayName = 'EmailTable';

export default function MailList({ 
  mailbox, 
  onSelectMail, 
  selectedMail, 
  onRefreshList, 
  onRefreshStatistics 
}: MailListProps) {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; ids: number[] } | null>(null);
  
  // Debounce search for API calls
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

  // Load mails when dependencies change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadMails();
    } else {
      loadMails();
    }
  }, [loadMails]);

  // Reset page when mailbox changes
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
    setSearchValue(''); // Reset search when mailbox changes
  }, [mailbox]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    // Reset to first page when search changes
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

  const handleMoveToTrash = useCallback(async (mail: Mail) => {
    setMails(prevMails => prevMails.filter(m => m.id !== mail.id));
    
    try {
      await moveToTrash(mail.id);
      onRefreshStatistics();
      loadMails();
    } catch (error) {
      loadMails();
      dispatchShowToast({ type: 'danger', message: 'Failed to move to trash' });
    }
  }, [loadMails, onRefreshStatistics]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const selectedCount = selectedIds.size;

  if (loading && mails.length === 0) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex items-center justify-center">
        <Loader type="circular" size={48} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Header with search and actions */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex gap-2">
          <SearchInputComponent
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search emails..."
          />
          {selectedCount > 0 && (
            <div className="flex gap-2">
              {!isTrashView ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleBulkAction('trash')}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Trash ({selectedCount})
                </Button>
              ) : (
                <>
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => handleBulkAction('restore')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restore ({selectedCount})
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete ({selectedCount})
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email Table - Separated component */}
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
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Dialog */}
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