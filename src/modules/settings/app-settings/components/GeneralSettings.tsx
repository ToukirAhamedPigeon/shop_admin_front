// D:\shop\shop_admin_front\src\modules\settings\app-settings\components\GeneralSettings.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CustomSelect } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';
import type { GeneralSettings as GeneralSettingsType } from '@/types/settings';

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onUpdate: (key: string, value: any) => void;
  loading: boolean;
}

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'বাংলা', value: 'bn' }
];

const TIMEZONE_OPTIONS = [
  { label: 'Asia/Dhaka (GMT+6)', value: 'Asia/Dhaka' },
  { label: 'UTC (GMT+0)', value: 'UTC' },
  { label: 'America/New_York (GMT-5)', value: 'America/New_York' },
  { label: 'Europe/London (GMT+0)', value: 'Europe/London' }
];

const DATE_FORMAT_OPTIONS = [
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
];

const TIME_FORMAT_OPTIONS = [
  { label: '12 Hour (hh:mm AM/PM)', value: '12h' },
  { label: '24 Hour (HH:mm)', value: '24h' }
];

const CURRENCY_OPTIONS = [
  { label: 'BDT (৳)', value: 'BDT' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' }
];

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  onUpdate,
  loading
}) => {
  const { t } = useTranslations();

  // Local state for immediate UI updates
  const [localSettings, setLocalSettings] = useState<GeneralSettingsType>(settings);

  // Update local state when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSelectChange = (key: string, value: string) => {
    // Update local state immediately for UI feedback
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    onUpdate(key, value);
  };

  // Helper to set value for CustomSelect
  const setValue = (name: string, value: any) => {
    handleSelectChange(name, value as string);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
          {t('Localization')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Default Language')}
            </label>
            <CustomSelect
              id="default_language"
              label=""
              name="default_language"
              setValue={setValue}
              value={localSettings.default_language || 'en'}
              options={LANGUAGE_OPTIONS}
              model="Settings"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Default Timezone')}
            </label>
            <CustomSelect
              id="timezone"
              label=""
              name="timezone"
              setValue={setValue}
              value={localSettings.timezone || 'Asia/Dhaka'}
              options={TIMEZONE_OPTIONS}
              model="Settings"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Date Format')}
            </label>
            <CustomSelect
              id="date_format"
              label=""
              name="date_format"
              setValue={setValue}
              value={localSettings.date_format || 'DD/MM/YYYY'}
              options={DATE_FORMAT_OPTIONS}
              model="Settings"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Time Format')}
            </label>
            <CustomSelect
              id="time_format"
              label=""
              name="time_format"
              setValue={setValue}
              value={localSettings.time_format || '12h'}
              options={TIME_FORMAT_OPTIONS}
              model="Settings"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Currency')}
            </label>
            <CustomSelect
              id="currency"
              label=""
              name="currency"
              setValue={setValue}
              value={localSettings.currency || 'BDT'}
              options={CURRENCY_OPTIONS}
              model="Settings"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};