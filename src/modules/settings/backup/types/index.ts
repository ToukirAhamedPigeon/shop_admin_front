// src/modules/backup/types/index.ts
export interface Backup {
  id: number;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  storageType: 'Local' | 'RemoteServer' | 'GoogleDrive';
  storagePath: string;
  checksum?: string;
  status: 'Success' | 'Failed' | 'InProgress';
  isDeleted: boolean;
  deletedAt?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupSchedule {
  id: number;
  name: string;
  cronExpression: string;
  isActive: boolean;
  retentionDays: number;
  storageDestinations: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageDestination {
  id: number;
  type: 'Local' | 'RemoteServer' | 'GoogleDrive';
  name: string;
  config: {
    path?: string;
    host?: string;
    port?: number;
    username?: string;
    folderId?: string;
    credentials?: any;
  };
  priority: number;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackupFilterRequest {
  q?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  storageType?: string;
  fromDate?: string;
  toDate?: string;
}

export interface BackupStatistics {
  totalBackups: number;
  totalSize: number;
  successCount: number;
  failedCount: number;
  storageUsed: {
    local: number;
    remoteServer: number;
    googleDrive: number;
  };
  lastBackupAt?: string;
  nextBackupAt?: string;
}