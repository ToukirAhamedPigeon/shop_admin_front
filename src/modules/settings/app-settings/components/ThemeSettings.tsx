// src/modules/settings/app-settings/components/ThemeSettings.tsx
import React, { useState, useEffect } from 'react';
import { ColorPicker } from './ColorPicker';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/hooks/useTranslations';
import type { ThemeSettings as ThemeSettingsType } from '@/types/settings';
import { SettingsSection, SettingRow, Toggle } from './SettingsLayout';
import { ImageDrop } from './ImageDrop';
import { cn } from '@/lib/utils';

interface ThemeSettingsProps {
  settings: ThemeSettingsType;
  onUpdate: (key: string, value: any) => void;
  onUpload: (key: string, file: File) => void;
  loading: boolean;
}

/** A tiny app mock that shows the chosen colours, sidebar image and mode. */
function ThemePreview({ theme, sidebarImage }: { theme: ThemeSettingsType; sidebarImage: string | null }) {
  const dark = theme.dark_mode;
  return (
    <div
      aria-hidden
      className={cn(
        'overflow-hidden rounded-xl border shadow-sm',
        dark ? 'border-white/10 bg-[#15171c] text-white' : 'border-black/10 bg-[#f7f8fa] text-gray-900'
      )}
    >
      <div className="flex h-44">
        <div
          className="relative w-[30%] shrink-0 bg-[#0f1a3a] bg-cover bg-center p-2.5"
          style={sidebarImage ? { backgroundImage: `linear-gradient(rgba(15,26,58,.75),rgba(15,26,58,.75)), url(${sidebarImage})` } : undefined}
        >
          <div className="mb-3 flex items-center gap-1.5">
            <span className="size-3.5 rounded" style={{ backgroundColor: theme.primary_color }} />
            <span className="h-1.5 w-10 rounded bg-white/70" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="mb-1.5 h-4 rounded"
              style={i === 1 ? { backgroundColor: theme.primary_color } : { backgroundColor: 'rgba(255,255,255,0.08)' }}
            />
          ))}
        </div>
        <div className="flex-1 space-y-2 p-3">
          <div className={cn('h-2 w-1/2 rounded', dark ? 'bg-white/60' : 'bg-gray-800/70')} />
          <div className={cn('rounded-lg border p-2', dark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-white')}>
            <div className={cn('mb-1.5 h-1.5 w-3/4 rounded', dark ? 'bg-white/25' : 'bg-gray-300')} />
            <div className={cn('mb-2 h-1.5 w-1/2 rounded', dark ? 'bg-white/25' : 'bg-gray-300')} />
            <div className="flex items-center gap-1.5">
              <span className="rounded px-2 py-0.5 text-[8px] font-semibold text-white" style={{ backgroundColor: theme.primary_color }}>
                Save
              </span>
              <span className="rounded-full px-1.5 py-0.5 text-[8px] font-medium text-white" style={{ backgroundColor: theme.secondary_color }}>
                Badge
              </span>
            </div>
          </div>
          <div className={cn('rounded-lg border p-2', dark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-white')}>
            <div className="h-1.5 w-2/3 rounded" style={{ backgroundColor: theme.primary_color, opacity: 0.8 }} />
            <div className={cn('mt-1.5 h-1.5 w-1/3 rounded', dark ? 'bg-white/25' : 'bg-gray-300')} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ settings, onUpdate, onUpload }) => {
  const { t } = useTranslations();

  // Local state for immediate UI updates
  const [localSettings, setLocalSettings] = useState<ThemeSettingsType>(settings);
  const [sidebarPreview, setSidebarPreview] = useState<string | null>(settings.sidebar_bg_image || null);
  const [loginPreview, setLoginPreview] = useState<string | null>(settings.login_bg_image || null);

  useEffect(() => {
    setLocalSettings(settings);
    setSidebarPreview(settings.sidebar_bg_image || null);
    setLoginPreview(settings.login_bg_image || null);
  }, [settings]);

  const change = <K extends keyof ThemeSettingsType>(key: K, value: ThemeSettingsType[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    onUpdate(key, value);
  };

  const handleImageDrop = (key: 'sidebar_bg_image' | 'login_bg_image') => (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (key === 'sidebar_bg_image') setSidebarPreview(previewUrl);
    else setLoginPreview(previewUrl);
    onUpload(key, file);
  };

  const handleImageClear = (key: 'sidebar_bg_image' | 'login_bg_image') => () => {
    if (key === 'sidebar_bg_image') setSidebarPreview(null);
    else setLoginPreview(null);
    onUpdate(key, '');
  };

  return (
    <div className="space-y-5">
      <SettingsSection title={t('Colours')} description={t('Used across the app once saved. The preview updates as you choose.')}>
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
          <div className="space-y-5">
            <div>
              <ColorPicker
                label={t('Primary colour')}
                value={localSettings.primary_color}
                onChange={(color: string) => change('primary_color', color)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{t('Buttons, links, the active menu item')}</p>
            </div>
            <div>
              <ColorPicker
                label={t('Secondary colour')}
                value={localSettings.secondary_color}
                onChange={(color: string) => change('secondary_color', color)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{t('Badges and accents')}</p>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('Preview')}</p>
            <ThemePreview theme={localSettings} sidebarImage={sidebarPreview} />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title={t('Appearance')}>
        <SettingRow label={t('Dark mode')} hint={t('Your default theme. The sun/moon button in the header can still switch it.')}>
          <div className="flex sm:justify-end">
            <Toggle checked={!!localSettings.dark_mode} onChange={(v) => change('dark_mode', v)} label={t('Dark mode')} />
          </div>
        </SettingRow>
      </SettingsSection>

      <SettingsSection title={t('Background images')} description={t('Optional pictures behind the sidebar and the sign-in page.')}>
        <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-2">
          <ImageDrop
            label="Sidebar background"
            image={sidebarPreview}
            onDrop={handleImageDrop('sidebar_bg_image')}
            onClear={handleImageClear('sidebar_bg_image')}
            hint="About 300×500 px, JPG or PNG"
          />
          <ImageDrop
            label="Sign-in page background"
            image={loginPreview}
            onDrop={handleImageDrop('login_bg_image')}
            onClear={handleImageClear('login_bg_image')}
            hint="About 1920×1080 px, JPG or PNG"
          />
        </div>
      </SettingsSection>

      <SettingsSection title={t('Custom CSS')} description={t('Advanced: extra styles applied on top of the theme.')}>
        <div className="p-4 sm:p-5">
          <Textarea
            value={localSettings.custom_css}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => change('custom_css', e.target.value)}
            placeholder="/* e.g. .app-sidebar { letter-spacing: .01em } */"
            spellCheck={false}
            aria-label={t('Custom CSS')}
            className="h-36 bg-muted/40 font-mono text-[13px]"
          />
        </div>
      </SettingsSection>
    </div>
  );
};
