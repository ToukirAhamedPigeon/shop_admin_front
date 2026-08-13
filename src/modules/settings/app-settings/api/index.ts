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

// Updated: Handle file uploads with FormData
export const updateThemeSettings = async (data: UpdateThemeSettings): Promise<UserSettings> => {
  const formData = new FormData();
  
  // Append text fields
  if (data.primary_color !== undefined) formData.append('primary_color', data.primary_color);
  if (data.secondary_color !== undefined) formData.append('secondary_color', data.secondary_color);
  if (data.dark_mode !== undefined) formData.append('dark_mode', String(data.dark_mode));
  if (data.custom_css !== undefined) formData.append('custom_css', data.custom_css);
  
  // Append files
  if (data.SidebarBgFile) formData.append('SidebarBgFile', data.SidebarBgFile);
  if (data.LoginBgFile) formData.append('LoginBgFile', data.LoginBgFile);
  
  const response = await api.put('/settings/theme', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateGeneralSettings = async (data: UpdateGeneralSettings): Promise<UserSettings> => {
  const response = await api.put('/settings/general', data);
  return response.data;
};

// Updated: Handle file uploads with FormData
export const updateBrandingSettings = async (data: UpdateBrandingSettings): Promise<BrandingSettings> => {
  const formData = new FormData();
  
  // Append text fields
  if (data.app_name !== undefined) formData.append('app_name', data.app_name);
  if (data.footer_text !== undefined) formData.append('footer_text', data.footer_text);
  
  // Append files
  if (data.LogoFile) formData.append('LogoFile', data.LogoFile);
  if (data.FaviconFile) formData.append('FaviconFile', data.FaviconFile);
  
  const response = await api.put('/settings/branding', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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