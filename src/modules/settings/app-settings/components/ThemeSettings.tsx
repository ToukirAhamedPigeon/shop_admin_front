// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\ThemeSettings.tsx
import React, { useState, useEffect } from 'react';
import { ColorPicker } from './ColorPicker';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppSelector } from '@/hooks/useRedux';
import type { ThemeSettings as ThemeSettingsType } from '@/types/settings';
import { Image, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeSettingsProps {
  settings: ThemeSettingsType;
  onUpdate: (key: string, value: any) => void;
  onUpload: (key: string, file: File) => void;
  loading: boolean;
}

const ImageUploadField: React.FC<{
  label: string;
  value: string | null;
  preview: string | null;
  onDrop: (files: File[]) => void;
  onClear: () => void;
  recommended: string;
}> = ({ label, value, preview, onDrop, onClear, recommended }) => {
  const { t } = useTranslations();
  const isDarkMode = useAppSelector((state) => state.theme.current) === 'dark';
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  const hasImage = preview || value;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/80">
        {t(label)}
      </label>
      
      {hasImage ? (
        // Preview mode
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={preview || value || ''}
            alt={label}
            className="w-full h-32 object-cover"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onClear}
              className="shadow-md"
            >
              <X className="w-4 h-4 mr-1" />
              {t('Remove')}
            </Button>
          </div>
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs bg-black/80 text-white rounded-full">
              {t('Image uploaded')}
            </span>
          </div>
        </div>
      ) : (
        // Upload mode
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50 hover:bg-accent/50",
            "min-h-[120px] flex flex-col items-center justify-center"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? t('Drop your image here')
              : t('Drag & drop or click to select an image')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t(recommended)}
          </p>
        </div>
      )}
    </div>
  );
};

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  settings,
  onUpdate,
  onUpload,
  loading
}) => {
  const { t } = useTranslations();

  // Local state for immediate UI updates
  const [localSettings, setLocalSettings] = useState<ThemeSettingsType>(settings);
  const [sidebarPreview, setSidebarPreview] = useState<string | null>(settings.sidebar_bg_image || null);
  const [loginPreview, setLoginPreview] = useState<string | null>(settings.login_bg_image || null);

  // Update local state when props change
  useEffect(() => {
    setLocalSettings(settings);
    setSidebarPreview(settings.sidebar_bg_image || null);
    setLoginPreview(settings.login_bg_image || null);
  }, [settings]);

  const handleColorChange = (key: string, color: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: color
    }));
    onUpdate(key, color);
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      dark_mode: checked
    }));
    onUpdate('dark_mode', checked);
  };

  const handleTextChange = (key: string, value: string) => {
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
        <h3 className="text-base font-semibold text-foreground">
          {t('Color Scheme')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ColorPicker
              label={t('Primary Color')}
              value={localSettings.primary_color}
              onChange={(color: string) => handleColorChange('primary_color', color)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('Affects: Buttons, Links, Headers')}
            </p>
            <div 
              className="mt-2 h-2 w-full rounded-full transition-colors duration-150"
              style={{ backgroundColor: localSettings.primary_color }}
            />
          </div>
          <div>
            <ColorPicker
              label={t('Secondary Color')}
              value={localSettings.secondary_color}
              onChange={(color: string) => handleColorChange('secondary_color', color)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('Affects: Cards, Borders, Badges')}
            </p>
            <div 
              className="mt-2 h-2 w-full rounded-full transition-colors duration-150"
              style={{ backgroundColor: localSettings.secondary_color }}
            />
          </div>
        </div>
      </Card>

      {/* Background Images */}
      <Card className="p-6 space-y-6">
        <h3 className="text-base font-semibold text-foreground">
          {t('Background Images')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUploadField
            label="Sidebar Background"
            value={settings.sidebar_bg_image}
            preview={sidebarPreview}
            onDrop={handleImageDrop('sidebar_bg_image')}
            onClear={handleImageClear('sidebar_bg_image')}
            recommended="Recommended: 300x500px, JPG/PNG"
          />
          <ImageUploadField
            label="Login Page Background"
            value={settings.login_bg_image}
            preview={loginPreview}
            onDrop={handleImageDrop('login_bg_image')}
            onClear={handleImageClear('login_bg_image')}
            recommended="Recommended: 1920x1080px, JPG/PNG"
          />
        </div>
      </Card>

      {/* Theme Preferences */}
      <Card className="p-6 space-y-6">
        <h3 className="text-base font-semibold text-foreground">
          {t('Theme Preferences')}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground/80">
              {t('Dark Mode')}
            </label>
            <p className="text-xs text-muted-foreground">
              {t('Toggle between light and dark theme')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDarkModeToggle(!localSettings.dark_mode)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${localSettings.dark_mode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${localSettings.dark_mode ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </Card>

      {/* Custom CSS */}
      <Card className="p-6 space-y-6">
        <h3 className="text-base font-semibold text-foreground">
          {t('Custom CSS')}
        </h3>
        <Textarea
          value={localSettings.custom_css}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTextChange('custom_css', e.target.value)}
          placeholder="/* Add custom CSS here */"
          className="font-mono h-32 bg-muted/50"
        />
        <p className="text-xs text-muted-foreground">
          {t('Advanced: Add custom CSS to override default styles')}
        </p>
      </Card>
    </div>
  );
};