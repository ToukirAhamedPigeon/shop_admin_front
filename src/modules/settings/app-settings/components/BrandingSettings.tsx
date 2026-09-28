// src/modules/settings/app-settings/components/BrandingSettings.tsx
import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/useTranslations';
import type { BrandingSettings as BrandingSettingsType } from '@/types/settings';
import { SettingsSection, SettingRow } from './SettingsLayout';
import { ImageDrop } from './ImageDrop';

// Same types as before the redesign; the API validates them too.
const BRAND_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];

interface BrandingSettingsProps {
  settings: BrandingSettingsType;
  onUpdate: (key: string, value: any) => void;
  onUpload: (key: string, file: File) => void;
  loading: boolean;
  isDeveloper: boolean;
}

/** How the header brand, browser tab and footer will look. */
function BrandPreview({ name, logo, favicon, footer }: { name: string; logo: string | null; favicon: string | null; footer: string }) {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      {/* Browser tab */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-1.5">
        <span className="flex size-4 items-center justify-center overflow-hidden rounded-sm bg-card">
          {favicon ? <img src={favicon} alt="" className="size-4 object-contain" /> : <span className="size-2 rounded-sm bg-primary" />}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">{name || 'AIMS'}</span>
      </div>
      {/* Header */}
      <div className="app-sidebar dark flex items-center gap-2.5 px-3 py-2.5">
        <span className="brand-mark flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <img src={logo || '/logo.png'} alt="" className="max-h-6 max-w-6 object-contain" />
        </span>
        <span className="truncate text-sm font-semibold text-white">{name || 'AIMS'}</span>
      </div>
      <div className="h-12 bg-background" />
      {/* Footer */}
      <div className="border-t border-border px-3 py-1.5 text-center text-[11px] text-muted-foreground">{footer || '—'}</div>
    </div>
  );
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ settings, onUpdate, onUpload, isDeveloper }) => {
  const { t } = useTranslations();

  const [localSettings, setLocalSettings] = useState<BrandingSettingsType>(settings);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(settings.favicon || null);

  useEffect(() => {
    setLocalSettings(settings);
    setLogoPreview(settings.logo || null);
    setFaviconPreview(settings.favicon || null);
  }, [settings]);

  const handleInputChange = (key: 'app_name' | 'footer_text', value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    onUpdate(key, value);
  };

  const handleImageDrop = (key: 'logo' | 'favicon') => (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (key === 'logo') setLogoPreview(previewUrl);
    else setFaviconPreview(previewUrl);
    onUpload(key, file);
  };

  const handleImageClear = (key: 'logo' | 'favicon') => () => {
    if (key === 'logo') setLogoPreview(null);
    else setFaviconPreview(null);
    onUpdate(key, '');
  };

  if (isDeveloper !== true) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-12 text-center">
        <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Lock className="size-6" />
        </span>
        <p className="text-sm font-medium text-foreground">{t('Branding settings can only be modified by Developer users.')}</p>
        <p className="text-sm text-muted-foreground">{t('Contact your system administrator for changes.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Preview')}</p>
        <BrandPreview name={localSettings.app_name} logo={logoPreview} favicon={faviconPreview} footer={localSettings.footer_text} />
      </div>

      <SettingsSection title={t('Name and text')}>
        <SettingRow label={t('Application name')} hint={t('Shown in the browser tab and the header.')} htmlFor="branding-app-name">
          <Input
            id="branding-app-name"
            value={localSettings.app_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('app_name', e.target.value)}
            placeholder={t('Enter application name')}
          />
        </SettingRow>
        <SettingRow label={t('Footer text')} hint={t('Shown at the bottom of every page.')} htmlFor="branding-footer">
          <Input
            id="branding-footer"
            value={localSettings.footer_text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('footer_text', e.target.value)}
            placeholder={t('Enter footer copyright text')}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title={t('Logo and icon')}>
        <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-2">
          <ImageDrop
            label="Logo"
            image={logoPreview}
            onDrop={handleImageDrop('logo')}
            onClear={handleImageClear('logo')}
            hint="About 200×60 px, PNG with a transparent background"
            fit="contain"
            height="h-28"
            accept={BRAND_IMAGE_TYPES}
          />
          <ImageDrop
            label="Favicon"
            image={faviconPreview}
            onDrop={handleImageDrop('favicon')}
            onClear={handleImageClear('favicon')}
            hint="32×32 px, ICO, PNG or SVG"
            fit="contain"
            height="h-28"
            accept={BRAND_IMAGE_TYPES}
          />
        </div>
      </SettingsSection>
    </div>
  );
};
