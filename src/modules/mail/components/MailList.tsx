// src/modules/mail/components/MailList.tsx
import { useState, useEffect, useCallback } from 'react';
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
import { getMails, bulkMailAction, toggleStar, moveToTrash, restoreFromTrash, markAsRead, markAsUnread } from '../api';
import type { Mail, MailboxType, MailFilterRequest } from '../types';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import Loader from '@/components/custom/Loader';

interface MailListProps {
  mailbox: MailboxType;
  onSelectMail: (mail: Mail) => void;
  selectedMail: Mail | null;
  onRefreshList: () => void;  // For full list refresh (rare)
  onRefreshStatistics: () => void;  // For statistics only
}

const ITEMS_PER_PAGE = 20;

// Helper to get the display value for sender/recipient based on mailbox and mail type
const getSenderDisplay = (mail: Mail, mailbox: MailboxType): string => {
  switch (mailbox) {
    case 'sent':
      return mail.toMail;
    case 'inbox':
      return mail.fromMail;
    case 'starred':
    case 'trash':
    default:
      if (mail.isSent) {
        return mail.toMail;
      } else {
        return mail.fromMail;
      }
  }
};

// Helper to get column header based on mailbox type
const getSenderColumnHeader = (mailbox: MailboxType): string => {
  switch (mailbox) {
    case 'sent':
      return 'To';
    case 'inbox':
      return 'From';
    case 'starred':
    case 'trash':
    default:
      return 'From/To';
  }
};

export default function MailList({ mailbox, onSelectMail, selectedMail, onRefreshList, onRefreshStatistics }: MailListProps) {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; ids: number[] } | null>(null);

  const loadMails = useCallback(async () => {
    setLoading(true);
    try {
      const request: MailFilterRequest = {
        page,
        limit: ITEMS_PER_PAGE,
        mailbox,
        q: search || undefined,
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
  }, [page, mailbox, search]);

  useEffect(() => {
    loadMails();
  }, [loadMails]);

  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [mailbox]);

  const handleStarClick = useCallback(async (e: React.MouseEvent, mail: Mail) => {
    e.stopPropagation();
    
    // Save original state for rollback
    const originalStarred = mail.isStarred;
    
    // Optimistically update local state
    setMails(prevMails => 
      prevMails.map(m => 
        m.id === mail.id ? { ...m, isStarred: !m.isStarred } : m
      )
    );
    
    try {
      await toggleStar(mail.id);
      // Only refresh statistics, NOT the full list
      onRefreshStatistics();
    } catch (error) {
      // Revert on error
      setMails(prevMails => 
        prevMails.map(m => 
          m.id === mail.id ? { ...m, isStarred: originalStarred } : m
        )
      );
      dispatchShowToast({ type: 'danger', message: 'Failed to update star status' });
    }
  }, [onRefreshStatistics]);

  const handleMailClick = useCallback((mail: Mail) => {
    if (!mail.isRead && !mail.isSent) {
      // Optimistically update local state
      setMails(prevMails => 
        prevMails.map(m => 
          m.id === mail.id ? { ...m, isRead: true } : m
        )
      );
      markAsRead(mail.id).catch(console.error);
      // Refresh statistics to update unread count
      onRefreshStatistics();
    }
    onSelectMail(mail);
  }, [onSelectMail, onRefreshStatistics]);

  const handleSelectChange = useCallback((id: number, checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'true';
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
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
      // Full refresh needed for bulk actions
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
    // Optimistically remove from current list
    setMails(prevMails => prevMails.filter(m => m.id !== mail.id));
    
    try {
      await moveToTrash(mail.id);
      onRefreshStatistics();
      // Reload to ensure consistency
      loadMails();
    } catch (error) {
      // Reload on error to restore
      loadMails();
      dispatchShowToast({ type: 'danger', message: 'Failed to move to trash' });
    }
  }, [loadMails, onRefreshStatistics]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const selectedCount = selectedIds.size;
  const isTrashView = mailbox === 'trash';
  const senderColumnHeader = getSenderColumnHeader(mailbox);

  if (loading) {
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
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
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

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-700">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.size === mails.length && mails.length > 0}
                  onCheckedChange={handleSelectAll}
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
                  onClick={() => handleMailClick(mail)}
                  className={cn(
                    "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    selectedMail?.id === mail.id && "bg-primary/5",
                    !mail.isRead && !mail.isSent && "font-semibold bg-blue-50/30 dark:bg-blue-950/20"
                  )}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(mail.id)}
                      onCheckedChange={(checked) => handleSelectChange(mail.id, checked)}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => handleStarClick(e, mail)} className="focus:outline-none cursor-pointer">
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
          title={`Bulk ${actionDialog.action}`}
          variant={actionDialog.action === 'delete' ? 'destructive' : 'warning'}
          confirmLabel={actionDialog.action}
          loading={bulkActionLoading}
        >
          <p>Are you sure you want to {actionDialog.action} {actionDialog.ids.length} selected message(s)?</p>
        </ConfirmDialog>
      )}
    </div>
  );
}