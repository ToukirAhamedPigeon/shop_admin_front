// src/modules/mail/components/MailSidebar.tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Plus,
  RefreshCw,
  Mail as MailIcon,
  TrendingUp,
  Users,
  Clock
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

const mailboxes: { id: MailboxType; label: string; icon: React.ReactNode; countKey?: keyof MailStatistics; gradient?: string }[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, countKey: 'totalReceived', gradient: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" />, countKey: 'starredCount', gradient: 'from-yellow-500/20 to-amber-500/20' },
  { id: 'sent', label: 'Sent', icon: <Send className="w-4 h-4" />, countKey: 'totalSent', gradient: 'from-emerald-500/20 to-teal-500/20' },
  { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" />, countKey: 'trashCount', gradient: 'from-red-500/20 to-rose-500/20' },
];

export default function MailSidebar({ 
  selectedMailbox, 
  onSelectMailbox, 
  statistics, 
  onCompose, 
  onRefresh, 
  refreshing 
}: MailSidebarProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Compose Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button 
          onClick={onCompose} 
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Compose Message
        </Button>
      </motion.div>

      {/* Mailboxes Navigation */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1"
      >
        {mailboxes.map((mailbox) => (
          <motion.button
            key={mailbox.id}
            variants={itemVariants}
            onClick={() => onSelectMailbox(mailbox.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer",
              selectedMailbox === mailbox.id
                ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm"
                : "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
            )}
          >
            <span className="flex items-center gap-3">
              <span className={cn(
                "transition-colors",
                selectedMailbox === mailbox.id ? "text-primary" : "text-gray-500"
              )}>
                {mailbox.icon}
              </span>
              <span className="font-medium">{mailbox.label}</span>
            </span>
            {mailbox.countKey && statistics && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-semibold",
                selectedMailbox === mailbox.id
                  ? "bg-primary/20 text-primary"
                  : "bg-gray-200/70 dark:bg-gray-700/70 text-gray-600 dark:text-gray-400"
              )}>
                {statistics[mailbox.countKey]}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Refresh Button */}
      {onRefresh && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh} 
            disabled={refreshing}
            className="w-full mt-2"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>
      )}

      {/* Statistics Section */}
      {statistics && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
        >
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 tracking-wider uppercase">
            Mail Statistics
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50/30 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100/50 dark:bg-blue-800/30">
                  <MailIcon className="w-3 h-3 text-blue-500" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Unread</span>
              </div>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {statistics.unreadCount}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-purple-50/30 dark:bg-purple-900/20">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-purple-100/50 dark:bg-purple-800/30">
                  <TrendingUp className="w-3 h-3 text-purple-500" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Total Messages</span>
              </div>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {statistics.totalReceived + statistics.totalSent}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}