// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\ThemeSettings.tsx
import React from 'react';
import { ColorPicker } from './ColorPicker';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { SingleImageInput } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppSelector } from '@/hooks/useRedux';
import type { AppSetting } from '@/types/settings';

interface ThemeSettingsProps {
  settings: AppSetting[];
  onUpdate: (key: string, value: any) => void;
  onUpload: (key: string, file: File) => void;
  loading: boolean;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  settings,
  onUpdate,
  onUpload,
  loading
}) => {
  const { t } = useTranslations();
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  const getSetting = (key: string) => settings.find(s => s.key === key);

  const primaryColor = getSetting('primary_color')?.value || '#3B82F6';
  const secondaryColor = getSetting('secondary_color')?.value || '#10B981';
  const darkMode = getSetting('dark_mode')?.value === 'true';
  const sidebarBg = getSetting('sidebar_bg_image')?.value || '';
  const loginBg = getSetting('login_bg_image')?.value || '';
  const customCss = getSetting('custom_css')?.value || '';

  const [sidebarPreview, setSidebarPreview] = React.useState<string | null>(sidebarBg || null);
  const [loginPreview, setLoginPreview] = React.useState<string | null>(loginBg || null);

  const handleColorChange = (key: string, color: string) => {
    onUpdate(key, color);
  };

  const handleDarkModeToggle = (checked: boolean) => {
    onUpdate('dark_mode', String(checked));
  };

  const handleTextChange = (key: string, value: string) => {
    onUpdate(key, value);
  };

  const handleImageDrop = (key: string) => (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (key === 'sidebar_bg_image') {
        setSidebarPreview(previewUrl);
      } else if (key === 'login_bg_image') {
        setLoginPreview(previewUrl);
      }
      onUpload(key, file);
    }
  };

  const handleImageClear = (key: string) => () => {
    if (key === 'sidebar_bg_image') {
      setSidebarPreview(null);
    } else if (key === 'login_bg_image') {
      setLoginPreview(null);
    }
    onUpdate(key, '');
  };

  return (
    <div className="space-y-6">
      {/* Color Scheme */}
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          {t('Color Scheme')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ColorPicker
              label={t('Primary Color')}
              value={primaryColor}
              onChange={(color: string) => handleColorChange('primary_color', color)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('Affects: Buttons, Links, Headers')}
            </p>
          </div>
          <div>
            <ColorPicker
              label={t('Secondary Color')}
              value={secondaryColor}
              onChange={(color: string) => handleColorChange('secondary_color', color)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('Affects: Cards, Borders, Badges')}
            </p>
          </div>
        </div>
      </Card>

      {/* Background Images */}
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
          {t('Background Images')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SingleImageInput
              label={t('Sidebar Background')}
              preview={sidebarPreview}
              onDrop={handleImageDrop('sidebar_bg_image')}
              clearImage={handleImageClear('sidebar_bg_image')}
              minHeightClass="h-32"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('Recommended: 300x500px, JPG/PNG')}
            </p>
          </div>
          <div>
            <SingleImageInput
              label={t('Login Page Background')}
              preview={loginPreview}
              onDrop={handleImageDrop('login_bg_image')}
              clearImage={handleImageClear('login_bg_image')}
              minHeightClass="h-32"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('Recommended: 1920x1080px, JPG/PNG')}
            </p>
          </div>
        </div>
      </Card>

      {/* Theme Preferences */}
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
          {t('Theme Preferences')}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('Dark Mode')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('Toggle between light and dark theme')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDarkModeToggle(!darkMode)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${darkMode ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </Card>

      {/* Custom CSS */}
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          {t('Custom CSS')}
        </h3>
        <Textarea
          value={customCss}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTextChange('custom_css', e.target.value)}
          placeholder="/* Add custom CSS here */"
          className="font-mono h-32 bg-gray-50 dark:bg-gray-900"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('Advanced: Add custom CSS to override default styles')}
        </p>
      </Card>
    </div>
  );
};