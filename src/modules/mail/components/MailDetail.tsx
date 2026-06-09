// src/modules/mail/components/MailDetail.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Star, 
  Reply, 
  Trash2, 
  Download,
  MailOpen,
  Mail as MailIcon,
  X,
  File,
  Image,
  FileText,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  Archive
} from 'lucide-react';
import { getMailById, toggleStar, moveToTrash, markAsRead, markAsUnread } from '../api';
import type { MailDetail as MailDetailType } from '../types';
import { dispatchShowToast } from '@/lib/dispatch';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import Loader from '@/components/custom/Loader';

interface MailDetailProps {
  mailId: number;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onReply: () => void;
}

// Remote storage URL from environment
const REMOTE_STORAGE_URL = import.meta.env.VITE_REMOTE_STORAGE_URL || 'https://shopfiles.pigeonic.com';

// Helper function to get full file URL (handles both local and remote paths)
const getFullFileUrl = (url: string): string => {
  if (!url) return '';
  
  // If it's already a full URL (starts with http), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path, prepend the remote storage URL
  if (url.startsWith('/uploads/')) {
    return `${REMOTE_STORAGE_URL}${url}`;
  }
  
  return url;
};

// Helper function to get file name from URL
const getFileNameFromUrl = (url: string): string => {
  try {
    const fullUrl = getFullFileUrl(url);
    const urlObj = new URL(fullUrl);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || '';
    // Remove timestamp prefix if present (format: timestamp_filename.ext)
    const parts = fileName.split('_');
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return parts.slice(1).join('_');
    }
    return fileName;
  } catch {
    return url.split('/').pop() || 'Unknown';
  }
};

// Helper function to get file extension
const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

// Helper function to get appropriate icon based on file extension
const getFileIcon = (fileName: string) => {
  const extension = getFileExtension(fileName);
  const iconClass = "w-4 h-4 flex-shrink-0";
  
  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(extension)) {
    return <Image className={`${iconClass} text-blue-500`} />;
  }
  // PDF
  if (extension === 'pdf') {
    return <FileText className={`${iconClass} text-red-500`} />;
  }
  // Word documents
  if (['doc', 'docx'].includes(extension)) {
    return <FileText className={`${iconClass} text-blue-600`} />;
  }
  // Excel spreadsheets
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return <FileSpreadsheet className={`${iconClass} text-green-600`} />;
  }
  // PowerPoint
  if (['ppt', 'pptx'].includes(extension)) {
    return <FileSpreadsheet className={`${iconClass} text-orange-500`} />;
  }
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return <Archive className={`${iconClass} text-yellow-600`} />;
  }
  // Audio
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extension)) {
    return <FileAudio className={`${iconClass} text-purple-500`} />;
  }
  // Video
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
    return <FileVideo className={`${iconClass} text-purple-600`} />;
  }
  // Text files
  if (['txt', 'html', 'htm', 'css', 'js', 'json', 'xml', 'md'].includes(extension)) {
    return <FileText className={`${iconClass} text-gray-500`} />;
  }
  // Default
  return <File className={`${iconClass} text-gray-400`} />;
};

// Helper function to truncate filename
const truncateFileName = (fileName: string, maxLength: number = 30): string => {
  if (fileName.length <= maxLength) return fileName;
  const extension = getFileExtension(fileName);
  const nameWithoutExt = fileName.slice(0, -(extension.length + 1));
  const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 3);
  return `${truncatedName}...${extension ? '.' + extension : ''}`;
};

export default function MailDetail({ mailId, open, onClose, onRefresh, onReply }: MailDetailProps) {
  const [mail, setMail] = useState<MailDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAttachments, setShowAllAttachments] = useState(false);

  useEffect(() => {
    if (open && mailId) {
      loadMail();
    }
  }, [open, mailId]);

  const loadMail = async () => {
    setLoading(true);
    try {
      const response = await getMailById(mailId);
      setMail(response.data);
    } catch (error) {
      console.error('Failed to load mail:', error);
      dispatchShowToast({ type: 'danger', message: 'Failed to load mail' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!mail) return;
    try {
      await toggleStar(mail.id);
      setMail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
      onRefresh();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to update star status' });
    }
  };

  const handleMoveToTrash = async () => {
    if (!mail) return;
    try {
      await moveToTrash(mail.id);
      dispatchShowToast({ type: 'success', message: 'Moved to trash' });
      onRefresh();
      onClose();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to move to trash' });
    }
  };

  const handleMarkAsRead = async () => {
    if (!mail || mail.isRead) return;
    try {
      await markAsRead(mail.id);
      setMail(prev => prev ? { ...prev, isRead: true } : null);
      onRefresh();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAsUnread = async () => {
    if (!mail || mail.isRead === false) return;
    try {
      await markAsUnread(mail.id);
      setMail(prev => prev ? { ...prev, isRead: false } : null);
      onRefresh();
    } catch (error) {
      console.error('Failed to mark as unread:', error);
    }
  };

  const handleDownloadAttachment = (url: string, fileName: string) => {
    const fullUrl = getFullFileUrl(url);
    window.open(fullUrl, '_blank');
  };

  const visibleAttachments = showAllAttachments 
    ? mail?.attachments || [] 
    : (mail?.attachments || []).slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mail?.subject || 'Mail Detail'}</DialogTitle>
          <div className="flex justify-between items-start">
            <div className="flex gap-1">
              <button
                onClick={handleToggleStar}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <Star
                  className={cn(
                    "w-5 h-5",
                    mail?.isStarred
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  )}
                />
              </button>
              <button
                onClick={mail?.isRead ? handleMarkAsUnread : handleMarkAsRead}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                title={mail?.isRead ? "Mark as unread" : "Mark as read"}
              >
                {mail?.isRead ? (
                  <MailIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <MailOpen className="w-5 h-5 text-blue-500" />
                )}
              </button>
              <button
                onClick={handleMoveToTrash}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <Trash2 className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader type="circular" size={48} />
          </div>
        ) : mail ? (
          <div className="space-y-4">
            {/* Email metadata */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div><span className="font-medium">From:</span> {mail.fromMail}</div>
                  <div><span className="font-medium">To:</span> {mail.toMail}</div>
                  {mail.ccMail && <div><span className="font-medium">Cc:</span> {mail.ccMail}</div>}
                </div>
                <div className="text-gray-500">
                  {format(new Date(mail.createdAt), 'MMMM dd, yyyy h:mm a')}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-4 border-b">
              <Button size="sm" variant="outline" onClick={onReply} className="cursor-pointer">
                <Reply className="w-4 h-4 mr-1" />
                Reply
              </Button>
            </div>

            {/* Email Body */}
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mail.body) }}
            />

            {/* Attachments */}
            {mail.attachments.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="text-sm font-medium mb-2">
                  Attachments ({mail.attachments.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleAttachments.map((attachment, index) => {
                    const fullUrl = getFullFileUrl(attachment);
                    const fileName = getFileNameFromUrl(fullUrl);
                    const displayName = truncateFileName(fileName);
                    const fileExtension = getFileExtension(fileName);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleDownloadAttachment(attachment, fileName)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer group"
                        title={fileName}
                      >
                        {getFileIcon(fileName)}
                        <span className="text-sm max-w-[200px] truncate">
                          {displayName}
                        </span>
                        {fileExtension && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                            {fileExtension}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {mail.attachments.length > 5 && !showAllAttachments && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowAllAttachments(true)}
                    className="mt-2 cursor-pointer"
                  >
                    Show all ({mail.attachments.length - 5} more)
                  </Button>
                )}
              </div>
            )}

            {/* Replies Thread */}
            {mail.replies.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="text-sm font-medium mb-3">
                  Replies ({mail.replies.length})
                </div>
                <div className="space-y-3">
                  {mail.replies.map(reply => (
                    <div key={reply.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{reply.fromMail}</span>
                        <span className="text-gray-500">
                          {format(new Date(reply.createdAt), 'MMM dd, h:mm a')}
                        </span>
                      </div>
                      <div 
                        className="text-sm mt-1 prose-sm"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.body) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">Mail not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}