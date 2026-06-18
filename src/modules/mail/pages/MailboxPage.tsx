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
import { RefreshCw, Mail as MailIcon, Inbox, Send, Star, Trash2, Menu, X } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

export default function MailboxPage() {
  const { t } = useTranslations();
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxType>('inbox');
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [statistics, setStatistics] = useState<MailStatistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [replyTo, setReplyTo] = useState<{ id: number; toMail: string; subject: string; fromMail: string } | undefined>();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const hasMailPermissions = can(['read-admin-mails']);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setShowMobileSidebar(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMobileSidebar && isMobile) {
        const sidebar = document.getElementById('mobile-sidebar');
        const toggleButton = document.getElementById('sidebar-toggle');
        if (sidebar && toggleButton) {
          if (!sidebar.contains(e.target as Node) && !toggleButton.contains(e.target as Node)) {
            setShowMobileSidebar(false);
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileSidebar, isMobile]);

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
      className="flex flex-col gap-4 h-full relative"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <Breadcrumb
          title="common.mail.title"
          showTitle={true}
          items={[{ label: "common.mail.title", href: "/mail" }]}
          className="pb-0"
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleFetchEmails} disabled={refreshing} variant="outline" size="sm" className="cursor-pointer hidden sm:flex">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Fetch Emails
          </Button>
          <Button 
            onClick={handleFetchEmails} 
            disabled={refreshing} 
            variant="outline" 
            size="sm" 
            className="cursor-pointer flex sm:hidden"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* Mobile Sidebar Toggle Button */}
          <Button 
            id="sidebar-toggle"
            variant="ghost" 
            size="sm" 
            className="lg:hidden cursor-pointer p-2"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileSidebar(!showMobileSidebar);
            }}
          >
            {showMobileSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Quick Stats - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-shrink-0"
      >
        <GlassCard variant="primary" padding="sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-black/5 dark:bg-white/5"
              >
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1 text-gray-800 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-1.5 sm:p-2 rounded-lg bg-${stat.color.split('-')[1]}-100/50 dark:bg-${stat.color.split('-')[1]}-900/30 ${stat.color}`}>
                  {stat.icon}
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Mail Section - Responsive with increased height */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <div
          id="mobile-sidebar"
          className={cn(
            "lg:w-64 xl:w-72 flex-shrink-0",
            "absolute lg:relative z-40",
            "w-[280px] lg:w-64 xl:w-72",
            "transform transition-all duration-300 ease-in-out",
            showMobileSidebar || !isMobile ? "translate-x-0" : "-translate-x-full",
            !isMobile && "opacity-100",
            isMobile && !showMobileSidebar && "opacity-0 pointer-events-none",
            isMobile && showMobileSidebar && "opacity-100 pointer-events-auto"
          )}
        >
          <GlassCard variant="secondary" padding="sm" className="h-full">
            <MailSidebar
              selectedMailbox={selectedMailbox}
              onSelectMailbox={(mailbox) => {
                setSelectedMailbox(mailbox);
                if (isMobile) setShowMobileSidebar(false);
              }}
              statistics={statistics}
              onCompose={() => {
                setReplyTo(undefined);
                setShowCompose(true);
                if (isMobile) setShowMobileSidebar(false);
              }}
              onRefresh={refreshStatistics}
              refreshing={refreshing}
              isMobile={isMobile}
            />
          </GlassCard>
        </div>

        {/* Mail List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex-1 min-w-0 flex flex-col"
        >
          <GlassCard variant="default" padding="none" className="flex-1 overflow-hidden">
            <MailList
              key={`${selectedMailbox}-${refreshKey}`}
              mailbox={selectedMailbox}
              onSelectMail={setSelectedMail}
              selectedMail={selectedMail}
              onRefreshList={refreshList}
              onRefreshStatistics={refreshStatistics}
              isMobile={isMobile}
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