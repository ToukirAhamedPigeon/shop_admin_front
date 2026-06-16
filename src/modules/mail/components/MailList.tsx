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
import { getMails, bulkMailAction, toggleStar, moveToTrash, markAsRead } from '../api';
import type { Mail, MailboxType, MailFilterRequest } from '../types';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import Loader from '@/components/custom/Loader';
import { capitalize } from '@/lib/helpers';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppSelector } from '@/hooks/useRedux';

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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
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
          "w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-0 group-focus-within:border-transparent",
          isMobile ? "pl-8 text-sm h-9" : "pl-10 h-10"
        )}
      />
      <div className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 opacity-0 group-focus-within:opacity-100"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)'
            : 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
          padding: '2px',
          borderRadius: '0.75rem',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <svg
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-300 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400",
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
  onSelectChange, 
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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
  return (
    <div className="flex-1 overflow-auto relative" style={{ maxHeight: isMobile ? 'calc(100vh - 420px)' : 'calc(100vh - 380px)', minHeight: '200px' }}>
      {loading && mails.length > 0 && (
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 flex items-center justify-center">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
            <Loader type="bars" size={32} />
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm sm:text-base">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
              <th className="p-2 sm:p-4 text-center w-8 sm:w-10">
                <div 
                  className="flex justify-center cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAll(selectedIds.size !== mails.length);
                  }}
                >
                  <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
                    selectedIds.size === mails.length && mails.length > 0
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 dark:from-blue-400 dark:to-indigo-500 dark:border-blue-400'
                      : selectedIds.size > 0
                        ? 'bg-blue-200 border-blue-400 dark:bg-blue-800 dark:border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                  }`}>
                    {selectedIds.size === mails.length && mails.length > 0 && (
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {selectedIds.size > 0 && selectedIds.size !== mails.length && (
                      <div className="w-1.5 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </div>
                </div>
              </th>
              <th className="p-2 sm:p-4 text-center w-8 sm:w-10"></th>
              <th className="p-2 sm:p-4 text-center w-8 sm:w-10"></th>
              <th className={cn(
                "p-2 sm:p-4 font-semibold text-gray-700 dark:text-gray-200",
                isMobile ? "text-xs" : "text-sm"
              )} style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                  : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                backdropFilter: 'blur(8px)',
              }}>{isMobile ? senderColumnHeader.slice(0, 1) : senderColumnHeader}</th>
              <th className={cn(
                "p-2 sm:p-4 font-semibold text-gray-700 dark:text-gray-200",
                isMobile ? "text-xs" : "text-sm"
              )} style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                  : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                backdropFilter: 'blur(8px)',
              }}>{isMobile ? 'Subj' : 'Subject'}</th>
              <th className={cn(
                "p-2 sm:p-4 text-center font-semibold text-gray-700 dark:text-gray-200",
                isMobile ? "text-xs w-20" : "text-sm w-32"
              )} style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                  : 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                backdropFilter: 'blur(8px)',
              }}>{isMobile ? 'Date' : 'Date'}</th>
            </tr>
          </thead>
          <tbody>
            {mails.length === 0 ? (
              <tr className="border-b border-gray-200/40 dark:border-gray-700/30">
                <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400 py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MailIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600" />
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
                    "transition-all duration-200 cursor-pointer",
                    "border-b border-gray-200/40 dark:border-gray-700/30",
                    index !== mails.length - 1 && "border-b",
                    selectedMail?.id === mail.id && "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5",
                    !mail.isRead && !mail.isSent && "bg-blue-50/30 dark:bg-blue-950/20",
                    !selectedMail || selectedMail?.id !== mail.id && "hover:bg-white/20 dark:hover:bg-white/5"
                  )}
                >
                  <td className="p-2 sm:p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <div className="cursor-pointer group">
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
                          selectedIds.has(mail.id)
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 dark:from-blue-400 dark:to-indigo-500 dark:border-blue-400'
                            : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                        }`}>
                          {selectedIds.has(mail.id) && (
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => onStarClick(e, mail)} 
                      className="focus:outline-none cursor-pointer group transition-all duration-200 hover:scale-110"
                    >
                      <Star className={cn(
                        "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200", 
                        mail.isStarred 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-400 group-hover:text-yellow-400"
                      )} />
                    </button>
                  </td>
                  <td className="p-2 sm:p-4 text-center">
                    {!mail.isRead && !mail.isSent ? (
                      <MailOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                    ) : (
                      <MailIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                    )}
                  </td>
                  <td className={cn(
                    "p-2 sm:p-4 text-gray-700 dark:text-gray-300",
                    !mail.isRead && !mail.isSent ? "font-semibold" : "",
                    isMobile ? "text-xs max-w-[60px] truncate" : "text-sm"
                  )}>
                    {isMobile ? getSenderDisplay(mail, mailbox).slice(0, 10) : getSenderDisplay(mail, mailbox)}
                  </td>
                  <td className={cn(
                    "p-2 sm:p-4 text-gray-700 dark:text-gray-300",
                    !mail.isRead && !mail.isSent ? "font-semibold" : "",
                    isMobile ? "text-xs max-w-[80px] truncate" : "text-sm max-w-[300px] truncate"
                  )}>
                    {isMobile ? mail.subject.slice(0, 15) : mail.subject}
                  </td>
                  <td className="p-2 sm:p-4 text-gray-500 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap text-center">
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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const selectedCount = selectedIds.size;

  if (loading && mails.length === 0) {
    return (
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200/30 dark:border-gray-700/30 flex items-center justify-center"
        style={{
          background: isDarkMode
            ? 'rgba(17, 24, 39, 0.4)'
            : 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(12px)',
        }}>
        <Loader type="circular" size={isMobile ? 32 : 48} />
      </div>
    );
  }

  return (
    <div 
      className="flex-1 rounded-xl overflow-hidden flex flex-col relative"
      style={{
        background: isDarkMode
          ? 'rgba(17, 24, 39, 0.4)'
          : 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
        boxShadow: isDarkMode
          ? '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(100,120,255,0.08), rgba(180,100,255,0.05))',
        }}
      />
      
      <div
        className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${isDarkMode ? '#6366f1' : '#818cf8'}, ${isDarkMode ? '#a855f7' : '#c084fc'}, transparent)`,
        }}
      />

      <div className="relative z-10 p-2 sm:p-4 border-b border-gray-200/30 dark:border-gray-700/30">
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
                  size={isMobile ? "sm" : "sm"}
                  onClick={() => handleBulkAction('trash')}
                  className={cn(
                    "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700",
                    isMobile ? "text-xs px-2 py-1" : ""
                  )}
                >
                  <Trash2 className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-0.5" : "mr-1")} />
                  {!isMobile && `Trash (${selectedCount})`}
                  {isMobile && selectedCount}
                </Button>
              ) : (
                <>
                  <Button 
                    size="sm"
                    onClick={() => handleBulkAction('restore')}
                    className={cn(
                      "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white",
                      isMobile ? "text-xs px-2 py-1" : ""
                    )}
                  >
                    <RotateCcw className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-0.5" : "mr-1")} />
                    {!isMobile && `Restore (${selectedCount})`}
                    {isMobile && selectedCount}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className={cn(
                      "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800",
                      isMobile ? "text-xs px-2 py-1" : ""
                    )}
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

      {totalPages > 1 && (
        <div className="relative z-10 p-2 sm:p-4 border-t border-gray-200/30 dark:border-gray-700/30 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg">
            {isMobile ? `${((page - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(page * ITEMS_PER_PAGE, totalCount)}` : `Showing ${((page - 1) * ITEMS_PER_PAGE) + 1} - ${Math.min(page * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`}
          </span>
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "sm"}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200",
                isMobile ? "text-xs px-2 py-1" : ""
              )}
            >
              <ChevronLeft className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-0.5" : "mr-1")} />
              {!isMobile && "Previous"}
            </Button>
            <span className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg">
              {isMobile ? `${page}/${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "sm"}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200",
                isMobile ? "text-xs px-2 py-1" : ""
              )}
            >
              {!isMobile && "Next"}
              <ChevronRight className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "ml-0.5" : "ml-1")} />
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