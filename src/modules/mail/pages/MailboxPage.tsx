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
import { RefreshCw, PenSquare } from 'lucide-react';

export default function MailboxPage() {
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
          <p className="text-muted-foreground text-center">
            You don't have permission to access this page.
          </p>
        </GlassCard>
      </div>
    );
  }

  const openCompose = () => {
    setReplyTo(undefined);
    setShowCompose(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col gap-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 [&>*:first-child]:min-w-0">
        <Breadcrumb
          title="common.mail.title"
          defaultTitle="Mailbox"
          showTitle={true}
          items={[{ label: "common.mail.title", defaultLabel: "Mailbox", href: "/mail" }]}
          className="pb-0"
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleFetchEmails} disabled={refreshing} variant="outline" size="sm" className="cursor-pointer" aria-label="Fetch new emails">
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Fetching…' : 'Fetch emails'}</span>
          </Button>
          {/* On desktop, Compose lives in the folder rail. */}
          <Button onClick={openCompose} size="sm" className="cursor-pointer md:hidden">
            <PenSquare className="size-4" />
            Compose
          </Button>
        </div>
      </div>

      {/* Phones: folders as a row of chips. */}
      <div className="md:hidden">
        <MailSidebar
          layout="tabs"
          selectedMailbox={selectedMailbox}
          onSelectMailbox={setSelectedMailbox}
          statistics={statistics}
          onCompose={openCompose}
        />
      </div>

      {/* One mail-client card: folder rail + message list. */}
      <GlassCard
        variant="default"
        padding="none"
        hoverEffect={false}
        className="flex min-h-[420px] flex-1 overflow-hidden md:h-[calc(100vh-13rem)] md:min-h-[520px] md:flex-none [&>div]:flex [&>div]:w-full [&>div]:min-w-0"
      >
        <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/30 md:block lg:w-64">
          <MailSidebar
            selectedMailbox={selectedMailbox}
            onSelectMailbox={setSelectedMailbox}
            statistics={statistics}
            onCompose={openCompose}
          />
        </aside>

        <section aria-label="Messages" className="flex min-w-0 flex-1 flex-col">
          <MailList
            key={`${selectedMailbox}-${refreshKey}`}
            mailbox={selectedMailbox}
            onSelectMail={setSelectedMail}
            selectedMail={selectedMail}
            onRefreshList={refreshList}
            onRefreshStatistics={refreshStatistics}
          />
        </section>
      </GlassCard>

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