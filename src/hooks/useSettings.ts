// D:\shop\shop_admin_front\src\modules\settings\app-settings\hooks\useSettings.ts
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';
import {
  fetchSettings,
  updateTheme,
  updateGeneral,
  updateBranding,
  resetTheme,
  resetGeneral,
  clearSettings
} from '@/redux/slices/settingsSlice';
import type {
  UpdateThemeSettings,
  UpdateGeneralSettings,
  UpdateBrandingSettings,
  UserSettings,
  BrandingSettings
} from '@/types/settings';
import { dispatchShowToast } from '@/lib/dispatch';
import { useTranslations } from '@/hooks/useTranslations';

export const useSettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslations();
  const { data, userSettings, brandingSettings, loading, error } = useSelector(
    (state: RootState) => state.settings
  );

  // Load settings on mount
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  // Update Theme settings
  const updateThemeSettings = useCallback(
    async (settings: UpdateThemeSettings): Promise<UserSettings> => {
      try {
        const result = await dispatch(updateTheme(settings)).unwrap();
        dispatchShowToast({
          type: 'success',
          message: t('Theme settings updated successfully')
        });
        return result;
      } catch (error: any) {
        dispatchShowToast({
          type: 'danger',
          message: error?.message || t('Failed to update theme settings')
        });
        throw error;
      }
    },
    [dispatch, t]
  );

  // Update General settings
  const updateGeneralSettings = useCallback(
    async (settings: UpdateGeneralSettings): Promise<UserSettings> => {
      try {
        const result = await dispatch(updateGeneral(settings)).unwrap();
        dispatchShowToast({
          type: 'success',
          message: t('General settings updated successfully')
        });
        return result;
      } catch (error: any) {
        dispatchShowToast({
          type: 'danger',
          message: error?.message || t('Failed to update general settings')
        });
        throw error;
      }
    },
    [dispatch, t]
  );

  // Update Branding settings (Developer only)
  const updateBrandingSettings = useCallback(
    async (settings: UpdateBrandingSettings): Promise<BrandingSettings> => {
      try {
        const result = await dispatch(updateBranding(settings)).unwrap();
        dispatchShowToast({
          type: 'success',
          message: t('Branding settings updated successfully')
        });
        return result;
      } catch (error: any) {
        dispatchShowToast({
          type: 'danger',
          message: error?.message || t('Failed to update branding settings')
        });
        throw error;
      }
    },
    [dispatch, t]
  );

  // Reset Theme settings
  const resetThemeSettings = useCallback(async (): Promise<UserSettings> => {
    try {
      const result = await dispatch(resetTheme()).unwrap();
      dispatchShowToast({
        type: 'success',
        message: t('Theme settings reset to defaults')
      });
      return result;
    } catch (error: any) {
      dispatchShowToast({
        type: 'danger',
        message: error?.message || t('Failed to reset theme settings')
      });
      throw error;
    }
  }, [dispatch, t]);

  // Reset General settings
  const resetGeneralSettings = useCallback(async (): Promise<UserSettings> => {
    try {
      const result = await dispatch(resetGeneral()).unwrap();
      dispatchShowToast({
        type: 'success',
        message: t('General settings reset to defaults')
      });
      return result;
    } catch (error: any) {
      dispatchShowToast({
        type: 'danger',
        message: error?.message || t('Failed to reset general settings')
      });
      throw error;
    }
  }, [dispatch, t]);

  // Clear settings cache
  const clearAllSettings = useCallback(() => {
    dispatch(clearSettings());
  }, [dispatch]);

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    await dispatch(fetchSettings());
  }, [dispatch]);

  return {
    data,
    userSettings,
    brandingSettings,
    loading,
    error,
    updateThemeSettings,
    updateGeneralSettings,
    updateBrandingSettings,
    resetThemeSettings,
    resetGeneralSettings,
    clearAllSettings,
    refreshSettings
  };
};