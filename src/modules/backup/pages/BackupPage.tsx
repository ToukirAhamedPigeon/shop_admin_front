// src/modules/backup/pages/BackupPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import BackupList from '../components/BackupList';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, HardDrive, Database, Cloud, Server, CheckCircle } from 'lucide-react';
import { getBackupStatistics, createBackup } from '../api';
import type { BackupStatistics } from '../types';
import { dispatchShowToast } from '@/lib/dispatch';
import { formatFileSize } from '@/lib/helpers';
import { can } from '@/lib/authCheck';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import { useAppSelector } from '@/hooks/useRedux';

export default function BackupPage() {
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
  const hasCreatePermission = can(['create-admin-backups']);

  const loadStatistics = useCallback(async () => {
    try {
      const response = await getBackupStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, []);

  const refreshList = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    refreshList();
    setRefreshing(false);
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      await createBackup({});
      dispatchShowToast({ type: 'success', message: 'Backup created successfully' });
      setBackupDialogOpen(false);
      handleRefresh();
    } catch (error) {
      dispatchShowToast({ type: 'danger', message: 'Failed to create backup' });
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const quickStats = [
    { 
      label: 'Total Backups', 
      value: statistics?.totalBackups || 0, 
      icon: <Database className="w-4 h-4" />, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Total Size', 
      value: formatFileSize(statistics?.totalSize || 0), 
      icon: <HardDrive className="w-4 h-4" />, 
      color: 'text-purple-500' 
    },
    { 
      label: 'Success Rate', 
      value: statistics ? `${Math.round((statistics.successCount / (statistics.successCount + statistics.failedCount || 1)) * 100)}%` : '0%', 
      icon: <CheckCircle className="w-4 h-4" />, 
      color: 'text-green-500' 
    },
    { 
      label: 'Google Drive', 
      value: formatFileSize(statistics?.storageUsed?.googleDrive || 0), 
      icon: <Cloud className="w-4 h-4" />, 
      color: 'text-emerald-500' 
    },
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
          title="common.backup.title"
          showTitle={true}
          items={[{ label: "common.backup.title", href: "/backup" }]}
          className="pb-0"
        />
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing} 
            variant="outline" 
            size="sm" 
            className="cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {hasCreatePermission && (
            <Button 
              onClick={() => setBackupDialogOpen(true)} 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Backup
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
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

      {/* Backup List */}
      <div className="flex-1 min-h-0">
        <BackupList
          key={refreshKey}
          onRefresh={handleRefresh}
          refreshKey={refreshKey}
        />
      </div>

      {/* Create Backup Dialog */}
      <ConfirmDialog
        open={backupDialogOpen}
        onCancel={() => setBackupDialogOpen(false)}
        onConfirm={handleCreateBackup}
        title="Create Backup"
        variant="info"
        icon={<Database className="w-6 h-6" />}
        confirmLabel={backupLoading ? 'Creating...' : 'Create Backup'}
        loading={backupLoading}
      >
        <div className="space-y-3">
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            This will create a full database backup.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The backup will be stored in all configured storage destinations.
          </p>
        </div>
      </ConfirmDialog>
    </motion.div>
  );
}