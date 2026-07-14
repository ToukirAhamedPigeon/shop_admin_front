// D:\shop\shop_admin_front\src\types\settings.ts
export interface AppSetting {
  id: string;
  category: string;
  key: string;
  value: string | null;
  dataType: 'text' | 'boolean' | 'color' | 'image' | 'select' | 'textarea' | 'number';
  description: string | null;
  isEncrypted: boolean;
  isActive: boolean;
  sortOrder: number;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
}

export interface SettingsGroup {
  category: string;
  displayName: string;
  icon: string;
  sortOrder: number;
  settings: AppSetting[];
}

export interface SettingsResponse {
  groups: SettingsGroup[];
  lastUpdated: string;
  updatedBy: string;
}

export interface UpdateSettingRequest {
  value: string;
}

export type SettingsMap = Record<string, Record<string, string>>;