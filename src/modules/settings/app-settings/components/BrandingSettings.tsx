// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\BrandingSettings.tsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from '@/hooks/useTranslations';
import type { BrandingSettings as BrandingSettingsType } from '@/types/settings';
import { X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/hooks/useRedux';

interface BrandingSettingsProps {
  settings: BrandingSettingsType;
  onUpdate: (key: string, value: any) => void;
  onUpload: (key: string, file: File) => void;
  loading: boolean;
  isDeveloper: boolean;
}

const ImageUploadField: React.FC<{
  label: string;
  value: string | null;
  preview: string | null;
  onDrop: (files: File[]) => void;
  onClear: () => void;
  recommended?: string;
}> = ({ label, value, preview, onDrop, onClear, recommended }) => {
  const { t } = useTranslations();
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico']
    },
    maxFiles: 1,
    multiple: false
  });

  const hasImage = preview || value;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t(label)}
      </label>
      
      {hasImage ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={preview || value || ''}
            alt={label}
            className="w-full h-24 object-contain bg-gray-50 dark:bg-gray-900"
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onClear}
              className="shadow-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50",
            "min-h-[100px] flex flex-col items-center justify-center"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isDragActive
              ? t('Drop your image here')
              : t('Click or drag to upload')}
          </p>
          {recommended && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t(recommended)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({
  settings,
  onUpdate,
  onUpload,
  loading,
  isDeveloper
}) => {
  const { t } = useTranslations();

  const [localSettings, setLocalSettings] = useState<BrandingSettingsType>(settings);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(settings.favicon || null);

  useEffect(() => {
    setLocalSettings(settings);
    setLogoPreview(settings.logo || null);
    setFaviconPreview(settings.favicon || null);
  }, [settings]);

  const handleInputChange = (key: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
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

  const isDeveloperUser = isDeveloper === true;

  if (!isDeveloperUser) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {t('Branding settings can only be modified by Developer users.')}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {t('Contact your system administrator for changes.')}
          </p>
        </div>
      </Card>
    );
  }

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
            value={localSettings.app_name}
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
        <ImageUploadField
          label="Upload Logo"
          value={settings.logo}
          preview={logoPreview}
          onDrop={handleImageDrop('logo')}
          onClear={handleImageClear('logo')}
          recommended="Recommended: 200x60px, PNG with transparent background"
        />
      </Card>

      {/* Favicon */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          {t('Favicon')}
        </h3>
        <ImageUploadField
          label="Upload Favicon"
          value={settings.favicon}
          preview={faviconPreview}
          onDrop={handleImageDrop('favicon')}
          onClear={handleImageClear('favicon')}
          recommended="Recommended: 32x32px, ICO/PNG/SVG"
        />
      </Card>

      {/* Footer Text */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
          {t('Footer Text')}
        </h3>
        <div>
          <Input
            value={localSettings.footer_text}
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