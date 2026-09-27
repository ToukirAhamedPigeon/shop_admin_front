// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { SettingsSidebar } from './SettingsSidebar';
import { SettingsContent } from './SettingsContent';
import { fetchSettings } from '@/redux/slices/settingsSlice';
import { useSettings } from '@/hooks/useSettings';
import type { AppDispatch } from '@/redux/store';
import Loader from '@/components/custom/Loader';
import { useAppSelector } from '@/hooks/useRedux';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeCategory, setActiveCategory] = useState('Theme');
  const { data, loading } = useAppSelector((state) => state.settings);

  const user = useAppSelector((state) => state.auth.user);
  
  const isDeveloper = user?.roles?.some(role => 
    role.toLowerCase() === 'developer'
  ) ?? false;

  const {
    updateThemeSettings,
    updateGeneralSettings,
    updateBrandingSettings,
    resetThemeSettings,
    resetGeneralSettings
  } = useSettings();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  // These functions now handle FormData with files
  const handleUpdateTheme = async (settings: any) => {
    // settings will contain SidebarBgFile and LoginBgFile as File objects
    await updateThemeSettings(settings);
  };

  const handleUpdateGeneral = async (settings: any) => {
    await updateGeneralSettings(settings);
  };

  const handleUpdateBranding = async (settings: any) => {
    // settings will contain LogoFile and FaviconFile as File objects
    await updateBrandingSettings(settings);
  };

  const handleResetTheme = async () => {
    await resetThemeSettings();
  };

  const handleResetGeneral = async () => {
    await resetGeneralSettings();
  };

  useEffect(() => {
    if (activeCategory === 'Branding' && !isDeveloper) {
      setActiveCategory('Theme');
    }
  }, [activeCategory, isDeveloper]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader type="circular" size={48} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col md:flex-row md:h-[calc(100vh-100px)] md:overflow-hidden"
    >
      <div className="flex-shrink-0 rounded-t-2xl border border-border bg-card md:rounded-t-none md:rounded-l-2xl">
        <SettingsSidebar
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          isDeveloper={isDeveloper}
        />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden rounded-b-2xl border border-t-0 border-border bg-background md:rounded-b-none md:rounded-r-2xl md:border-t md:border-l-0">
        <SettingsContent
          category={activeCategory}
          data={data}
          loading={loading}
          isDeveloper={isDeveloper}
          onUpdateTheme={handleUpdateTheme}
          onUpdateGeneral={handleUpdateGeneral}
          onUpdateBranding={handleUpdateBranding}
          onResetTheme={handleResetTheme}
          onResetGeneral={handleResetGeneral}
        />
      </div>
    </motion.div>
  );
};