// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\SettingsContent.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeSettings } from './ThemeSettings';
import { BrandingSettings } from './BrandingSettings';
import { GeneralSettings } from './GeneralSettings';
import { useTranslations } from '@/hooks/useTranslations';
import { CATEGORY_CONFIG } from '../config/categories';
import type { SettingsResponse } from '@/types/settings';
import { RefreshCw, Save, RotateCcw } from 'lucide-react';
import { dispatchShowToast } from '@/lib/dispatch';

interface SettingsContentProps {
  category: string;
  data: SettingsResponse | null;
  loading: boolean;
  isDeveloper: boolean;
  onUpdateTheme: (settings: any) => Promise<void>;
  onUpdateGeneral: (settings: any) => Promise<void>;
  onUpdateBranding: (settings: any) => Promise<void>;
  onResetTheme: () => Promise<void>;
  onResetGeneral: () => Promise<void>;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  category,
  data,
  loading,
  isDeveloper,
  onUpdateTheme,
  onUpdateGeneral,
  onUpdateBranding,
  onResetTheme,
  onResetGeneral
}) => {
  const { t } = useTranslations();
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  
  // Track uploaded files separately
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];

  if (!data || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('No settings available')}</p>
      </div>
    );
  }

  const handleSettingUpdate = (key: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle file upload - store the actual File object
  const handleImageUpload = (key: string, file: File) => {
    // Store the file for later submission
    setPendingFiles(prev => ({
      ...prev,
      [key]: file
    }));
    
    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    handleSettingUpdate(key, previewUrl);
    
    dispatchShowToast({ type: 'success', message: t('Image uploaded successfully') });
  };

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0 && Object.keys(pendingFiles).length === 0) {
      dispatchShowToast({ type: 'info', message: t('No changes to save') });
      return;
    }

    setSaving(true);
    try {
      // Prepare data for submission
      let submitData: any = { ...pendingChanges };
      
      // Add files to the data
      if (category === 'Theme') {
        // Map file keys to backend expected field names
        if (pendingFiles.sidebar_bg_image) {
          submitData.SidebarBgFile = pendingFiles.sidebar_bg_image;
        }
        if (pendingFiles.login_bg_image) {
          submitData.LoginBgFile = pendingFiles.login_bg_image;
        }
        await onUpdateTheme(submitData);
      } else if (category === 'Branding') {
        // Map file keys to backend expected field names
        if (pendingFiles.logo) {
          submitData.LogoFile = pendingFiles.logo;
        }
        if (pendingFiles.favicon) {
          submitData.FaviconFile = pendingFiles.favicon;
        }
        await onUpdateBranding(submitData);
      } else if (category === 'General') {
        await onUpdateGeneral(submitData);
      } else {
        throw new Error('Unknown category');
      }
      
      // Clear pending changes and files after successful save
      setPendingChanges({});
      setPendingFiles({});
      dispatchShowToast({ type: 'success', message: t('Settings saved successfully') });
    } catch (error) {
      console.error('Save error:', error);
      dispatchShowToast({ type: 'danger', message: t('Failed to save settings') });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm(t('Are you sure you want to reset all settings in this category to defaults?'))) {
      try {
        switch (category) {
          case 'Theme':
            await onResetTheme();
            break;
          case 'General':
            await onResetGeneral();
            break;
          default:
            dispatchShowToast({ type: 'info', message: t('This category cannot be reset') });
            return;
        }
        setPendingChanges({});
        setPendingFiles({});
        dispatchShowToast({ type: 'success', message: t('Settings reset to defaults') });
      } catch (error) {
        console.error('Reset error:', error);
        dispatchShowToast({ type: 'danger', message: t('Failed to reset settings') });
      }
    }
  };

  const renderSettings = () => {
    switch (category) {
      case 'Theme':
        return (
          <ThemeSettings
            settings={data.user.theme}
            onUpdate={handleSettingUpdate}
            onUpload={handleImageUpload}
            loading={loading}
          />
        );
      case 'Branding':
        return (
          <BrandingSettings
            settings={data.branding}
            onUpdate={handleSettingUpdate}
            onUpload={handleImageUpload}
            loading={loading}
            isDeveloper={isDeveloper}
          />
        );
      case 'General':
        return (
          <GeneralSettings
            settings={data.user.general}
            onUpdate={handleSettingUpdate}
            loading={loading}
          />
        );
      default:
        return <p>{t('No settings available for this category')}</p>;
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0 || Object.keys(pendingFiles).length > 0;
  const canEdit = category !== 'Branding' || isDeveloper;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 h-full overflow-y-auto p-4 sm:p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t(config.displayName)}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t(config.description)}
            </p>
            {!canEdit && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t('⚠️ These settings are global and can only be modified by Developer users.')}
              </p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('Reset to Default')}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasPendingChanges}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? t('Saving...') : t('Save Changes')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Pending Changes Indicator */}
        {hasPendingChanges && canEdit && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {t('You have unsaved changes. Click "Save Changes" to apply them.')}
            </p>
          </div>
        )}

        {/* Settings Content */}
        <div className="space-y-6 pb-8">
          {renderSettings()}
        </div>
      </div>
    </motion.div>
  );
};