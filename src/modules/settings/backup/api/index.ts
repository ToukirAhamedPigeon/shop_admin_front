// src/modules/backup/api/index.ts
import api from '@/lib/axios';
import type { Backup, BackupSchedule, StorageDestination, BackupFilterRequest, BackupStatistics } from '../types';

// Backup endpoints
export const getBackupStatistics = () => 
  api.get<BackupStatistics>('/Backup/statistics');

export const getBackups = (request: BackupFilterRequest) => 
  api.post<{ backups: Backup[]; totalCount: number; grandTotalCount: number }>('/Backup', request);

export const getBackupById = (id: number) => 
  api.get<Backup>(`/Backup/${id}`);

export const createBackup = (data: { name?: string; storageDestinations?: string[] }) => 
  api.post<{ success: boolean; backup: Backup }>('/Backup/create', data);

export const deleteBackup = (id: number) => 
  api.delete(`/Backup/${id}`);

export const downloadBackup = (id: number) => 
  api.get(`/Backup/${id}/download`, { responseType: 'blob' });

export const restoreBackup = (id: number) => 
  api.post(`/Backup/${id}/restore`);

export const cleanOldBackups = (retentionDays: number) => 
  api.post('/Backup/cleanup', { retentionDays });

// Schedule endpoints
export const getSchedules = () => 
  api.get<{ schedules: BackupSchedule[] }>('/Backup/schedule');

export const createSchedule = (data: Omit<BackupSchedule, 'id' | 'createdAt' | 'updatedAt' | 'createdByName'>) => 
  api.post<{ success: boolean; schedule: BackupSchedule }>('/Backup/schedule', data);

export const updateSchedule = (id: number, data: Partial<BackupSchedule>) => 
  api.put<{ success: boolean; schedule: BackupSchedule }>(`/Backup/schedule/${id}`, data);

export const deleteSchedule = (id: number) => 
  api.delete(`/Backup/schedule/${id}`);

// Storage destination endpoints
export const getStorageDestinations = () => 
  api.get<{ destinations: StorageDestination[] }>('/Backup/storage');

export const createStorageDestination = (data: Omit<StorageDestination, 'id' | 'createdAt' | 'updatedAt'>) => 
  api.post<{ success: boolean; destination: StorageDestination }>('/Backup/storage', data);

export const updateStorageDestination = (id: number, data: Partial<StorageDestination>) => 
  api.put<{ success: boolean; destination: StorageDestination }>(`/Backup/storage/${id}`, data);

export const deleteStorageDestination = (id: number) => 
  api.delete(`/Backup/storage/${id}`);

export const testStorageConnection = (id: number) => 
  api.post<{ success: boolean; message: string }>(`/Backup/storage/${id}/test`);

export const bulkDeleteBackups = (ids: string[]) => 
  api.post('/Backup/bulk-delete', { ids });
