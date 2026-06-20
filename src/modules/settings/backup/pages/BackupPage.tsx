// src/modules/backup/pages/BackupPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import GlassCard from '@/components/custom/GlassCard';
import BackupList from '../components/BackupList';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, HardDrive, Database, Cloud, Server, CheckCircle } from 'lucide-react';
import { getBackupStatistics, createBackup, getStorageDestinations } from '../api';
import type { BackupStatistics, StorageDestination } from '../types';
import { dispatchShowToast } from '@/lib/dispatch';
import { formatFileSize } from '@/lib/helpers';
import { can } from '@/lib/authCheck';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import { useAppSelector } from '@/hooks/useRedux';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function BackupPage() {
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [storageDestinations, setStorageDestinations] = useState<StorageDestination[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
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

  const loadStorageDestinations = useCallback(async () => {
    try {
      const response = await getStorageDestinations();
      setStorageDestinations(response.data.destinations || []);
      const remoteDest = response.data.destinations?.find(d => d.type === 'RemoteServer');
      if (remoteDest) {
        setSelectedDestinations(['RemoteServer']);
      }
    } catch (error) {
      console.error('Failed to load storage destinations:', error);
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
    if (selectedDestinations.length === 0) {
      dispatchShowToast({ type: 'warning', message: 'Please select at least one storage destination' });
      return;
    }

    setBackupLoading(true);
    try {
      // isManual will be handled by backend default (true)
      await createBackup({ 
        storageDestinations: selectedDestinations
      });
      dispatchShowToast({ type: 'success', message: 'Backup created successfully' });
      setBackupDialogOpen(false);
      handleRefresh();
    } catch (error: any) {
      dispatchShowToast({ type: 'danger', message: error.response?.data?.message || 'Failed to create backup' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleOpenDialog = () => {
    loadStorageDestinations();
    setBackupDialogOpen(true);
  };

  const handleDestinationToggle = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedDestinations([...selectedDestinations, type]);
    } else {
      setSelectedDestinations(selectedDestinations.filter(d => d !== type));
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const getStorageIcon = (type: string) => {
    switch (type) {
      case 'RemoteServer': return <Server className="w-4 h-4 text-purple-500" />;
      case 'GoogleDrive': return <Cloud className="w-4 h-4 text-green-500" />;
      case 'Local': return <HardDrive className="w-4 h-4 text-blue-500" />;
      default: return <HardDrive className="w-4 h-4 text-gray-500" />;
    }
  };

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
              onClick={handleOpenDialog} 
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

      {/* Create Backup Dialog with Storage Selection */}
      <ConfirmDialog
        open={backupDialogOpen}
        onCancel={() => setBackupDialogOpen(false)}
        onConfirm={handleCreateBackup}
        title="Create Database Backup"
        variant="info"
        icon={<Database className="w-6 h-6" />}
        confirmLabel={backupLoading ? 'Creating...' : 'Create Backup'}
        loading={backupLoading}
      >
        <div className="space-y-4">
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            Select storage destinations for this backup:
          </p>
          
          <div className="space-y-2">
            {storageDestinations.map((dest) => (
              <div 
                key={dest.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  selectedDestinations.includes(dest.type)
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Checkbox
                  id={`dest-${dest.id}`}
                  checked={selectedDestinations.includes(dest.type)}
                  onCheckedChange={(checked) => handleDestinationToggle(dest.type, !!checked)}
                  className="cursor-pointer"
                />
                <Label htmlFor={`dest-${dest.id}`} className="cursor-pointer flex items-center gap-2 flex-1">
                  {getStorageIcon(dest.type)}
                  <span className="font-medium">{dest.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {dest.isPrimary ? 'Primary' : 'Secondary'}
                  </span>
                </Label>
              </div>
            ))}
          </div>
          
          {storageDestinations.length === 0 && (
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">
              ⚠️ No storage destinations configured. Please configure at least one storage destination.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </motion.div>
  );
}