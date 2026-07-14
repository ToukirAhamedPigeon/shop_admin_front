// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\BrandingSettings.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SingleImageInput } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppSelector } from '@/hooks/useRedux';
import type { AppSetting } from '@/types/settings';

interface BrandingSettingsProps {
  settings: AppSetting[];
  onUpdate: (key: string, value: any) => void;
  onUpload: (key: string, file: File) => void;
  loading: boolean;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({
  settings,
  onUpdate,
  onUpload,
  loading
}) => {
  const { t } = useTranslations();
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';

  const getSetting = (key: string) => settings.find(s => s.key === key);

  const appName = getSetting('app_name')?.value || 'Shop Management';
  const logo = getSetting('logo')?.value || '';
  const favicon = getSetting('favicon')?.value || '';
  const footerText = getSetting('footer_text')?.value || '';

  const [logoPreview, setLogoPreview] = React.useState<string | null>(logo || null);
  const [faviconPreview, setFaviconPreview] = React.useState<string | null>(favicon || null);

  const handleInputChange = (key: string, value: string) => {
    onUpdate(key, value);
  };

  const handleImageDrop = (key: string) => (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (key === 'logo') {
        setLogoPreview(previewUrl);
      } else if (key === 'favicon') {
        setFaviconPreview(previewUrl);
      }
      onUpload(key, file);
    }
  };

  const handleImageClear = (key: string) => () => {
    if (key === 'logo') {
      setLogoPreview(null);
    } else if (key === 'favicon') {
      setFaviconPreview(null);
    }
    onUpdate(key, '');
  };

  return (
    <div className="space-y-6">
      {/* Application Name */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
          {t('Application Name')}
        </h3>
        <div>
          <Input
            value={appName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('app_name', e.target.value)}
            placeholder={t('Enter application name')}
            className="max-w-md"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('This name appears in the browser tab and header')}
          </p>
        </div>
      </Card>

      {/* Logo */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
          {t('Logo')}
        </h3>
        <SingleImageInput
          label={t('Upload Logo')}
          preview={logoPreview}
          onDrop={handleImageDrop('logo')}
          clearImage={handleImageClear('logo')}
          minHeightClass="h-24"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('Recommended: 200x60px, PNG with transparent background')}
        </p>
      </Card>

      {/* Favicon */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          {t('Favicon')}
        </h3>
        <SingleImageInput
          label={t('Upload Favicon')}
          preview={faviconPreview}
          onDrop={handleImageDrop('favicon')}
          clearImage={handleImageClear('favicon')}
          minHeightClass="h-16"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('Recommended: 32x32px, ICO/PNG/SVG')}
        </p>
      </Card>

      {/* Footer Text */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
          {t('Footer Text')}
        </h3>
        <div>
          <Input
            value={footerText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('footer_text', e.target.value)}
            placeholder={t('Enter footer copyright text')}
            className="max-w-md"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('This appears at the bottom of every page')}
          </p>
        </div>
      </Card>
    </div>
  );
};