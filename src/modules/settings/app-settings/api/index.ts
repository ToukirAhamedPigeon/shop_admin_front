// D:\shop\shop_admin_front\src\modules\settings\app-settings\api\index.ts
import api from '@/lib/axios';
import type {
  SettingsResponse,
  UserSettings,
  BrandingSettings,
  UpdateThemeSettings,
  UpdateGeneralSettings,
  UpdateBrandingSettings
} from '@/types/settings';

export const getAllSettings = async (): Promise<SettingsResponse> => {
  const response = await api.get('/settings');
  return response.data;
};

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await api.get('/settings/user');
  return response.data;
};

export const getBrandingSettings = async (): Promise<BrandingSettings> => {
  const response = await api.get('/settings/branding');
  return response.data;
};

export const updateThemeSettings = async (data: UpdateThemeSettings): Promise<UserSettings> => {
  const response = await api.put('/settings/theme', data);
  return response.data;
};

export const updateGeneralSettings = async (data: UpdateGeneralSettings): Promise<UserSettings> => {
  const response = await api.put('/settings/general', data);
  return response.data;
};

export const updateBrandingSettings = async (data: UpdateBrandingSettings): Promise<BrandingSettings> => {
  const response = await api.put('/settings/branding', data);
  return response.data;
};

export const resetThemeSettings = async (): Promise<UserSettings> => {
  const response = await api.post('/settings/reset/theme');
  return response.data;
};

export const resetGeneralSettings = async (): Promise<UserSettings> => {
  const response = await api.post('/settings/reset/general');
  return response.data;
};