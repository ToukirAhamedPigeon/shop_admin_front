// D:\shop\shop_admin_front\src\modules\settings\app-settings\api\index.ts
import api from '@/lib/axios';
import type { SettingsResponse, SettingsGroup, AppSetting } from '@/types/settings';

export const getAllSettings = async (): Promise<SettingsResponse> => {
  const response = await api.get('/settings');
  return response.data;
};

export const getPublicSettings = async () => {
  const response = await api.get('/settings/public');
  return response.data;
};

export const getSettingsByCategory = async (category: string): Promise<SettingsGroup> => {
  const response = await api.get(`/settings/category/${category}`);
  return response.data;
};

export const updateSetting = async (id: string, value: string): Promise<AppSetting> => {
  const response = await api.put(`/settings/${id}`, { value });
  return response.data;
};

export const updateCategorySettings = async (category: string, settings: Record<string, any>) => {
  const response = await api.put(`/settings/category/${category}`, settings);
  return response.data;
};

export const resetCategory = async (category: string) => {
  const response = await api.post(`/settings/reset/${category}`);
  return response.data;
};

export const clearCache = async () => {
  const response = await api.post('/settings/clear-cache');
  return response.data;
};