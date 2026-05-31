// src/modules/mail/components/MailSidebar.tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Plus,
  RefreshCw
} from 'lucide-react';
import type { MailboxType, MailStatistics } from '../types';

interface MailSidebarProps {
  selectedMailbox: MailboxType;
  onSelectMailbox: (mailbox: MailboxType) => void;
  statistics: MailStatistics | null;
  onCompose: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const mailboxes: { id: MailboxType; label: string; icon: React.ReactNode; countKey?: keyof MailStatistics }[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, countKey: 'totalReceived' },
  { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" />, countKey: 'starredCount' },
  { id: 'sent', label: 'Sent', icon: <Send className="w-4 h-4" />, countKey: 'totalSent' },
  { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" />, countKey: 'trashCount' },
];

export default function MailSidebar({ 
  selectedMailbox, 
  onSelectMailbox, 
  statistics, 
  onCompose, 
  onRefresh, 
  refreshing 
}: MailSidebarProps) {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-col gap-2">
      <Button onClick={onCompose} className="w-full mb-4">
        <Plus className="w-4 h-4 mr-2" />
        Compose
      </Button>

      <div className="space-y-1">
        {mailboxes.map((mailbox) => (
          <button
            key={mailbox.id}
            onClick={() => onSelectMailbox(mailbox.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer",
              selectedMailbox === mailbox.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            )}
          >
            <span className="flex items-center gap-3">
              {mailbox.icon}
              <span>{mailbox.label}</span>
            </span>
            {mailbox.countKey && statistics && (
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {statistics[mailbox.countKey]}
              </span>
            )}
          </button>
        ))}
      </div>

      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          disabled={refreshing}
          className="mt-2"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}

      {statistics && (
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Unread:</span>
              <span className="font-semibold">{statistics.unreadCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-semibold">
                {statistics.totalReceived + statistics.totalSent}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}