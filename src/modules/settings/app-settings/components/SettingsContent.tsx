// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\SettingsContent.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThemeSettings } from './ThemeSettings';
import { BrandingSettings } from './BrandingSettings';
import { GeneralSettings } from './GeneralSettings';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppSelector } from '@/hooks/useRedux';
import { CATEGORY_CONFIG } from '../config/categories';
import type { SettingsGroup } from '@/types/settings';
import { RefreshCw, Save, RotateCcw } from 'lucide-react';
import { dispatchShowToast } from '@/lib/dispatch';

interface SettingsContentProps {
  category: string;
  groups: SettingsGroup[];
  loading: boolean;
  onUpdate: (category: string, settings: Record<string, any>) => Promise<void>;
  onReset: (category: string) => Promise<void>;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  category,
  groups,
  loading,
  onUpdate,
  onReset
}) => {
  const { t } = useTranslations();
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

  const group = groups.find(g => g.category === category);
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];

  if (!group || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('Category not found')}</p>
      </div>
    );
  }

  const handleSettingUpdate = (key: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleImageUpload = async (key: string, file: File) => {
    // For now, we'll just update the setting with a placeholder URL
    // In production, you should upload to your server and get the URL back
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', key);
      formData.append('category', category);
      
      // TODO: Implement actual image upload endpoint
      // const response = await api.post('/settings/upload', formData);
      // handleSettingUpdate(key, response.data.url);
      
      // Temporary: Store base64 for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        handleSettingUpdate(key, base64);
      };
      reader.readAsDataURL(file);
      
      dispatchShowToast({ type: 'success', message: t('Image uploaded successfully') });
    } catch (error) {
      console.error('Upload error:', error);
      dispatchShowToast({ type: 'danger', message: t('Failed to upload image') });
    }
  };

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      dispatchShowToast({ type: 'info', message: t('No changes to save') });
      return;
    }

    setSaving(true);
    try {
      await onUpdate(category, pendingChanges);
      setPendingChanges({});
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
        await onReset(category);
        setPendingChanges({});
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
            settings={group.settings}
            onUpdate={handleSettingUpdate}
            onUpload={handleImageUpload}
            loading={loading}
          />
        );
      case 'Branding':
        return (
          <BrandingSettings
            settings={group.settings}
            onUpdate={handleSettingUpdate}
            onUpload={handleImageUpload}
            loading={loading}
          />
        );
      case 'General':
        return (
          <GeneralSettings
            settings={group.settings}
            onUpdate={handleSettingUpdate}
            loading={loading}
          />
        );
      default:
        return <p>{t('No settings available for this category')}</p>;
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 p-6 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {t(config.displayName)}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t(config.description)}
          </p>
        </div>
        <div className="flex gap-3">
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
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? t('Saving...') : t('Save Changes')}
          </Button>
        </div>
      </div>

      {/* Pending Changes Indicator */}
      {hasPendingChanges && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {t('You have unsaved changes. Click "Save Changes" to apply them.')}
          </p>
        </div>
      )}

      {/* Settings Content */}
      <div className="space-y-6">
        {renderSettings()}
      </div>
    </motion.div>
  );
};