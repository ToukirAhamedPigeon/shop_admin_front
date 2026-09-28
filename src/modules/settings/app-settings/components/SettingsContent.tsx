// src/modules/settings/app-settings/components/SettingsContent.tsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/custom/ConfirmDialog';
import { ThemeSettings } from './ThemeSettings';
import { BrandingSettings } from './BrandingSettings';
import { GeneralSettings } from './GeneralSettings';
import { useTranslations } from '@/hooks/useTranslations';
import { CATEGORY_CONFIG } from '../config/categories';
import type { SettingsResponse } from '@/types/settings';
import { Loader2, Save, RotateCcw, Globe2 } from 'lucide-react';

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
  /** Tells the page whether there are unsaved edits (it asks before switching category). */
  onDirtyChange?: (dirty: boolean) => void;
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
  onResetGeneral,
  onDirtyChange,
}) => {
  const { t } = useTranslations();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  // Uploaded files are kept apart and sent as form fields.
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  // Bumped to throw away edits: the panel remounts from the saved values.
  const [formKey, setFormKey] = useState(0);

  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
  const hasPendingChanges = Object.keys(pendingChanges).length > 0 || Object.keys(pendingFiles).length > 0;
  const canEdit = category !== 'Branding' || isDeveloper;
  const canReset = category === 'Theme' || category === 'General';

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

  if (!data || !config) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">{t('No settings available')}</p>
      </div>
    );
  }

  const handleSettingUpdate = (key: string, value: any) => {
    setPendingChanges((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (key: string, file: File) => {
    setPendingFiles((prev) => ({ ...prev, [key]: file }));
    handleSettingUpdate(key, URL.createObjectURL(file));
  };

  const discard = () => {
    setPendingChanges({});
    setPendingFiles({});
    setFormKey((k) => k + 1);
  };

  const handleSave = async () => {
    if (!hasPendingChanges) return;
    setSaving(true);
    try {
      const submitData: any = { ...pendingChanges };
      if (category === 'Theme') {
        // Field names the API expects for the files.
        if (pendingFiles.sidebar_bg_image) submitData.SidebarBgFile = pendingFiles.sidebar_bg_image;
        if (pendingFiles.login_bg_image) submitData.LoginBgFile = pendingFiles.login_bg_image;
        await onUpdateTheme(submitData);
      } else if (category === 'Branding') {
        if (pendingFiles.logo) submitData.LogoFile = pendingFiles.logo;
        if (pendingFiles.favicon) submitData.FaviconFile = pendingFiles.favicon;
        await onUpdateBranding(submitData);
      } else if (category === 'General') {
        await onUpdateGeneral(submitData);
      } else {
        throw new Error('Unknown category');
      }
      setPendingChanges({});
      setPendingFiles({});
      // useSettings shows the success or failure toast.
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      if (category === 'Theme') await onResetTheme();
      else if (category === 'General') await onResetGeneral();
      discard();
    } catch (error) {
      console.error('Reset error:', error);
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  const renderSettings = () => {
    switch (category) {
      case 'Theme':
        return <ThemeSettings settings={data.user.theme} onUpdate={handleSettingUpdate} onUpload={handleImageUpload} loading={loading} />;
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
        return <GeneralSettings settings={data.user.general} onUpdate={handleSettingUpdate} loading={loading} />;
      default:
        return <p>{t('No settings available for this category')}</p>;
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{t(config.displayName)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(config.description)}</p>
              {!config.isUserSpecific && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                  <Globe2 className="size-3.5" />
                  {t('Applies to everyone')}
                </p>
              )}
            </div>
            {canEdit && canReset && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} className="text-muted-foreground">
                <RotateCcw className="size-4" />
                {t('Reset to default')}
              </Button>
            )}
          </div>

          <div key={`${category}-${formKey}`} className={hasPendingChanges && canEdit ? 'pb-24' : 'pb-8'}>
            {renderSettings()}
          </div>
        </div>
      </div>

      {/* Unsaved changes bar */}
      <AnimatePresence>
        {hasPendingChanges && canEdit && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            // Phones: pinned to the screen (the page scrolls). md+: to the bottom of the settings card.
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 md:absolute md:z-10"
          >
            <div
              role="status"
              className="pointer-events-auto mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm"
            >
              <span className="size-2 shrink-0 rounded-full bg-warning" />
              <p className="mr-auto text-sm font-medium text-foreground">{t('You have unsaved changes')}</p>
              <Button variant="ghost" size="sm" onClick={discard} disabled={saving}>
                {t('Discard')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? t('Saving...') : t('Save changes')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title={t('Reset to default')}
        variant="warning"
        confirmLabel={resetting ? t('Resetting…') : t('Reset')}
        loading={resetting}
      >
        <p>{t('Every setting on this page goes back to its default value.')}</p>
      </ConfirmDialog>
    </div>
  );
};
