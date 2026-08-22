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
  isMobile?: boolean; // Added this property
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
  refreshing,
  isMobile = false
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
    <div className="flex flex-col gap-3 sm:gap-4 h-full p-1 sm:p-0">
      {/* Compose Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onCompose}
          className={cn("w-full", isMobile ? "text-sm py-1.5" : "")}
        >
          <Plus className={cn("w-4 h-4", isMobile ? "mr-1" : "mr-2")} />
          {isMobile ? "Compose" : "Compose Message"}
        </Button>
      </motion.div>

      {/* Mailboxes Navigation */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-0.5 sm:space-y-1"
      >
        {mailboxes.map((mailbox) => (
          <motion.button
            key={mailbox.id}
            variants={itemVariants}
            onClick={() => onSelectMailbox(mailbox.id)}
            className={cn(
              "w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-colors duration-200 cursor-pointer",
              selectedMailbox === mailbox.id
                ? "bg-primary/10 text-primary shadow-sm"
                : "hover:bg-muted text-foreground",
              isMobile ? "text-sm" : ""
            )}
          >
            <span className="flex items-center gap-2 sm:gap-3">
              <span className={cn(
                "transition-colors",
                selectedMailbox === mailbox.id ? "text-primary" : "text-muted-foreground"
              )}>
                {mailbox.icon}
              </span>
              <span className="font-medium">{isMobile ? mailbox.label.slice(0, 4) : mailbox.label}</span>
            </span>
            {mailbox.countKey && statistics && (
              <span className={cn(
                "text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold",
                selectedMailbox === mailbox.id
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
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
            className={cn(
              "w-full mt-1 sm:mt-2",
              isMobile ? "text-xs py-1" : ""
            )}
          >
            <RefreshCw className={cn("w-3 h-3 sm:w-4 sm:h-4", isMobile ? "mr-1" : "mr-2", refreshing ? 'animate-spin' : '')} />
            {!isMobile && "Refresh"}
          </Button>
        </motion.div>
      )}

      {/* Statistics Section */}
      {statistics && !isMobile && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-auto pt-4 border-t border-border"
        >
          <p className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider uppercase">
            Mail Statistics
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 rounded-lg bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10">
                  <MailIcon className="w-3 h-3 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Unread</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {statistics.unreadCount}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-background">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {statistics.totalReceived + statistics.totalSent}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}