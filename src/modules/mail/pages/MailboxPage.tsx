// src/modules/mail/pages/MailboxPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import MailSidebar from '../components/MailSidebar';
import MailList from '../components/MailList';
import ComposeMail from '../components/ComposeMail';
import MailDetail from '../components/MailDetail';
import GlassCard from '@/components/custom/GlassCard';
import type { MailboxType, Mail, MailStatistics } from '../types';
import { getMailStatistics, fetchEmails } from '../api';
import { can } from '@/lib/authCheck';
import { dispatchShowToast } from '@/lib/dispatch';
import { Button } from '@/components/ui/button';
import { RefreshCw, Mail as MailIcon, Inbox, Send, Star, Trash2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

export default function MailboxPage() {
  const { t } = useTranslations();
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxType>('inbox');
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [statistics, setStatistics] = useState<MailStatistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [replyTo, setReplyTo] = useState<{ id: number; toMail: string; subject: string; fromMail: string } | undefined>();

  const hasMailPermissions = can(['read-admin-mails']);

  const loadStatistics = useCallback(async () => {
    try {
      const response = await getMailStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, []);

  const refreshList = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const refreshStatistics = useCallback(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleFetchEmails = async () => {
    setRefreshing(true);
    try {
      await fetchEmails();
      dispatchShowToast({ type: 'success', message: 'Emails fetched successfully' });
      refreshList();
      refreshStatistics();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to fetch emails' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleReply = (mail: Mail) => {
    setReplyTo({
      id: mail.id,
      toMail: mail.fromMail,
      subject: mail.subject,
      fromMail: mail.fromMail
    });
    setSelectedMail(null);
    setShowCompose(true);
  };

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  if (!hasMailPermissions) {
    return (
      <div className="flex items-center justify-center h-96">
        <GlassCard variant="default" padding="lg">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            You don't have permission to access this page.
          </p>
        </GlassCard>
      </div>
    );
  }

  // Quick stats for sidebar display
  const quickStats = [
    { label: 'Inbox', value: statistics?.totalReceived || 0, icon: <Inbox className="w-4 h-4" />, color: 'text-blue-500' },
    { label: 'Sent', value: statistics?.totalSent || 0, icon: <Send className="w-4 h-4" />, color: 'text-emerald-500' },
    { label: 'Starred', value: statistics?.starredCount || 0, icon: <Star className="w-4 h-4" />, color: 'text-yellow-500' },
    { label: 'Unread', value: statistics?.unreadCount || 0, icon: <MailIcon className="w-4 h-4" />, color: 'text-purple-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 h-full"
    >
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <Breadcrumb
          title="common.mail.title"
          showTitle={true}
          items={[{ label: "common.mail.title", href: "/mail" }]}
          className="pb-0"
        />
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleFetchEmails} disabled={refreshing} variant="outline" size="sm" className="cursor-pointer">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Fetch Emails
          </Button>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassCard variant="primary" padding="sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5"
              >
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-${stat.color.split('-')[1]}-100/50 dark:bg-${stat.color.split('-')[1]}-900/30 ${stat.color}`}>
                  {stat.icon}
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Mail Section */}
      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-72 flex-shrink-0"
        >
          <GlassCard variant="secondary" padding="sm" className="h-full">
            <MailSidebar
              selectedMailbox={selectedMailbox}
              onSelectMailbox={setSelectedMailbox}
              statistics={statistics}
              onCompose={() => {
                setReplyTo(undefined);
                setShowCompose(true);
              }}
              onRefresh={refreshStatistics}
              refreshing={refreshing}
            />
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 min-w-0"
        >
          <GlassCard variant="default" padding="none" className="h-full overflow-hidden">
            <MailList
              key={`${selectedMailbox}-${refreshKey}`}
              mailbox={selectedMailbox}
              onSelectMail={setSelectedMail}
              selectedMail={selectedMail}
              onRefreshList={refreshList}
              onRefreshStatistics={refreshStatistics}
            />
          </GlassCard>
        </motion.div>
      </div>

      <ComposeMail
        open={showCompose}
        onClose={() => {
          setShowCompose(false);
          setReplyTo(undefined);
        }}
        onSent={() => {
          refreshList();
          refreshStatistics();
        }}
        replyTo={replyTo}
      />

      {selectedMail && (
        <MailDetail
          mailId={selectedMail.id}
          open={!!selectedMail}
          onClose={() => setSelectedMail(null)}
          onRefresh={() => {
            refreshList();
            refreshStatistics();
          }}
          onReply={() => handleReply(selectedMail)}
        />
      )}
    </motion.div>
  );
}