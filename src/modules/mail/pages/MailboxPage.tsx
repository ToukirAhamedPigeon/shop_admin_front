// src/modules/mail/pages/MailboxPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import MailSidebar from '../components/MailSidebar';
import MailList from '../components/MailList';
import ComposeMail from '../components/ComposeMail';
import MailDetail from '../components/MailDetail';
import type { MailboxType, Mail, MailStatistics } from '../types';
import { getMailStatistics, fetchEmails } from '../api';
import { can } from '@/lib/authCheck';
import { dispatchShowToast } from '@/lib/dispatch';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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
      console.log('Loading statistics...');
      const response = await getMailStatistics();
      console.log('Statistics response:', response.data);
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Don't show toast for statistics errors
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics, refreshKey]);

  const handleFetchEmails = async () => {
    setRefreshing(true);
    try {
      await fetchEmails();
      dispatchShowToast({ type: 'success', message: 'Emails fetched successfully' });
      refreshData();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to fetch emails' });
    } finally {
      setRefreshing(false);
    }
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
    loadStatistics();
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
        <p className="text-gray-500">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 h-full"
    >
      <div className="flex justify-between items-center">
        <Breadcrumb
          title="common.mail.title"
          showTitle={true}
          items={[
            { 
              label: "common.mail.title", 
              href: "/mail" 
            }
          ]}
          className="pb-0"
        />
        <Button onClick={handleFetchEmails} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Fetch Emails
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        <MailSidebar
          selectedMailbox={selectedMailbox}
          onSelectMailbox={setSelectedMailbox}
          statistics={statistics}
          onCompose={() => {
            setReplyTo(undefined);
            setShowCompose(true);
          }}
          onRefresh={refreshData}
          refreshing={refreshing}
        />
        
        <MailList
          key={`${selectedMailbox}-${refreshKey}`}
          mailbox={selectedMailbox}
          onSelectMail={setSelectedMail}
          selectedMail={selectedMail}
          onRefresh={refreshData}
        />
      </div>

      <ComposeMail
        open={showCompose}
        onClose={() => {
          setShowCompose(false);
          setReplyTo(undefined);
        }}
        onSent={refreshData}
        replyTo={replyTo}
      />

      {selectedMail && (
        <MailDetail
          mailId={selectedMail.id}
          open={!!selectedMail}
          onClose={() => setSelectedMail(null)}
          onRefresh={refreshData}
          onReply={() => handleReply(selectedMail)}
        />
      )}
    </motion.div>
  );
}