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
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
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
      className="flex h-[calc(100vh-100px)] overflow-hidden"
    >
      <div
        className="rounded-l-2xl flex-shrink-0"
        style={{
          background: isDarkMode
            ? 'rgba(17, 24, 39, 0.6)'
            : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)'}`,
        }}
      >
        <SettingsSidebar
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          isDeveloper={isDeveloper}
        />
      </div>

      <div
        className="flex-1 rounded-r-2xl overflow-hidden"
        style={{
          background: isDarkMode
            ? 'rgba(17, 24, 39, 0.3)'
            : 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)'}`,
        }}
      >
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