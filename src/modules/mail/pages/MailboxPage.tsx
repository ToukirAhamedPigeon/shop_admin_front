// src/modules/mail/pages/MailboxPage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import MailSidebar from '../components/MailSidebar';
import MailList, { type MailListHandle } from '../components/MailList';
import ComposeMail from '../components/ComposeMail';
import MailReader from '../components/MailReader';
import GlassCard from '@/components/custom/GlassCard';
import type { MailboxType, Mail, MailStatistics } from '../types';
import { getMailStatistics, fetchEmails } from '../api';
import { can } from '@/lib/authCheck';
import { dispatchShowToast } from '@/lib/dispatch';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCw, PenSquare, PanelRight, MailOpen } from 'lucide-react';

// The reading pane sits beside the list from this width up; below it, the
// open message takes the list's place.
const SPLIT_QUERY = '(min-width: 1280px)';
const SPLIT_KEY = 'mail-split';

const readSplitPref = () => {
  try {
    return localStorage.getItem(SPLIT_KEY) !== 'off';
  } catch {
    return true;
  }
};

// Keys typed into a field, or pressed while a dialog is open, aren't shortcuts.
const ignoreKey = (e: KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return true;
  const el = e.target as HTMLElement | null;
  if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return true;
  return !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
};

export default function MailboxPage() {
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxType>('inbox');
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [listMails, setListMails] = useState<Mail[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [statistics, setStatistics] = useState<MailStatistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [replyTo, setReplyTo] = useState<{ id: number; toMail: string; subject: string; fromMail: string } | undefined>();
  const [splitPref, setSplitPref] = useState(readSplitPref);
  const listRef = useRef<MailListHandle>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const wide = useMediaQuery(SPLIT_QUERY);
  const split = wide && splitPref;
  const reading = !!selectedMail;

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
    setShowCompose(true);
  };

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const selectMailbox = (mailbox: MailboxType) => {
    setSelectedMailbox(mailbox);
    setSelectedMail(null);
  };

  const openMail = useCallback((mail: Mail) => {
    setSelectedMail(mail);
    // On phones the message replaces the list; start at its top.
    if (!window.matchMedia('(min-width: 768px)').matches) {
      cardRef.current?.scrollIntoView({ block: 'start' });
    }
  }, []);

  const closeMail = useCallback(() => setSelectedMail(null), []);

  const index = selectedMail ? listMails.findIndex(m => m.id === selectedMail.id) : -1;
  const newer = index > 0 ? listMails[index - 1] : undefined;
  const older = index >= 0 && index < listMails.length - 1 ? listMails[index + 1] : undefined;

  const handleReaderRemoved = (id: number) => {
    const next = older ?? newer;
    listRef.current?.remove(id);
    // Split view moves on to the next message; otherwise go back to the list.
    setSelectedMail(split && next ? next : null);
  };

  const handleListRemoved = useCallback((ids: number[]) => {
    setSelectedMail(current => (current && ids.includes(current.id) ? null : current));
  }, []);

  const toggleSplit = () => {
    setSplitPref(on => {
      try {
        localStorage.setItem(SPLIT_KEY, on ? 'off' : 'on');
      } catch {
        /* private mode: the choice lasts for this visit only */
      }
      return !on;
    });
  };

  // j / k step through messages, Esc closes the open one.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ignoreKey(e)) return;
      if (e.key === 'Escape' && selectedMail) {
        setSelectedMail(null);
      } else if (e.key === 'j' || e.key === 'k') {
        const target = !selectedMail ? listMails[0] : e.key === 'j' ? older : newer;
        if (target) openMail(target);
      } else {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMail, listMails, older, newer, openMail]);

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
          <Button
            onClick={toggleSplit}
            variant="outline"
            size="sm"
            aria-pressed={splitPref}
            title={splitPref ? 'Open messages in place of the list' : 'Open messages beside the list'}
            className={cn('hidden cursor-pointer xl:inline-flex', splitPref && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary')}
          >
            <PanelRight className="size-4" />
            Split view
          </Button>
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

      {/* Phones: folders as a row of chips (hidden while reading a message). */}
      <div className={cn('md:hidden', reading && 'hidden')}>
        <MailSidebar
          layout="tabs"
          selectedMailbox={selectedMailbox}
          onSelectMailbox={selectMailbox}
          statistics={statistics}
          onCompose={openCompose}
        />
      </div>

      {/* One mail-client card: folder rail, message list and reading pane. */}
      <GlassCard
        ref={cardRef}
        variant="default"
        padding="none"
        hoverEffect={false}
        className="flex min-h-[420px] flex-1 scroll-mt-20 overflow-hidden md:h-[calc(100vh-13rem)] md:min-h-[520px] md:flex-none [&>div]:flex [&>div]:w-full [&>div]:min-w-0"
      >
        {split ? (
          <>
            <aside className="w-[68px] shrink-0 border-r border-border bg-muted/30 2xl:hidden">
              <MailSidebar
                layout="icons"
                selectedMailbox={selectedMailbox}
                onSelectMailbox={selectMailbox}
                statistics={statistics}
                onCompose={openCompose}
              />
            </aside>
            <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/30 2xl:block">
              <MailSidebar
                selectedMailbox={selectedMailbox}
                onSelectMailbox={selectMailbox}
                statistics={statistics}
                onCompose={openCompose}
              />
            </aside>
          </>
        ) : (
          <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/30 md:block lg:w-64">
            <MailSidebar
              selectedMailbox={selectedMailbox}
              onSelectMailbox={selectMailbox}
              statistics={statistics}
              onCompose={openCompose}
            />
          </aside>
        )}

        {/* The list stays mounted while a message is open, so its page and scroll survive. */}
        <section
          aria-label="Messages"
          className={cn(
            'flex min-w-0 flex-col',
            split ? 'w-[22rem] shrink-0 border-r border-border 2xl:w-[26rem]' : 'flex-1',
            !split && reading && 'hidden'
          )}
        >
          <MailList
            key={`${selectedMailbox}-${refreshKey}`}
            ref={listRef}
            mailbox={selectedMailbox}
            onSelectMail={openMail}
            selectedMail={selectedMail}
            onRefreshList={refreshList}
            onRefreshStatistics={refreshStatistics}
            onMailsChange={setListMails}
            onRemoved={handleListRemoved}
          />
        </section>

        {selectedMail ? (
          <section aria-label="Message" className="flex min-w-0 flex-1 flex-col">
            <MailReader
              mailId={selectedMail.id}
              mailbox={selectedMailbox}
              variant={split ? 'pane' : 'page'}
              onClose={closeMail}
              onReply={handleReply}
              onChange={(id, changes) => listRef.current?.patch(id, changes)}
              onRemoved={handleReaderRemoved}
              onStatisticsChange={refreshStatistics}
              onPrev={newer ? () => openMail(newer) : undefined}
              onNext={older ? () => openMail(older) : undefined}
              position={index >= 0 ? { index, total: listMails.length } : undefined}
            />
          </section>
        ) : (
          split && (
            <section aria-label="Message" className="hidden min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-muted/20 p-8 text-center xl:flex">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MailOpen className="size-8" />
              </span>
              <p className="text-base font-medium text-foreground">Select a message to read</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                It opens here, beside the list. Use{' '}
                <kbd className="rounded border border-border bg-card px-1.5 font-sans text-xs">j</kbd> and{' '}
                <kbd className="rounded border border-border bg-card px-1.5 font-sans text-xs">k</kbd> to move between messages.
              </p>
            </section>
          )
        )}
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
    </motion.div>
  );
}
