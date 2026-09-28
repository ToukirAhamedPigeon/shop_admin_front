// src/modules/settings/app-settings/components/GeneralSettings.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Clock, Coins } from 'lucide-react';
import { CustomSelect } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';
import type { GeneralSettings as GeneralSettingsType } from '@/types/settings';
import { SettingsSection, SettingRow } from './SettingsLayout';

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onUpdate: (key: string, value: any) => void;
  loading: boolean;
}

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'বাংলা', value: 'bn' },
];

const TIMEZONE_OPTIONS = [
  { label: 'Asia/Dhaka (GMT+6)', value: 'Asia/Dhaka' },
  { label: 'UTC (GMT+0)', value: 'UTC' },
  { label: 'America/New_York (GMT-5)', value: 'America/New_York' },
  { label: 'Europe/London (GMT+0)', value: 'Europe/London' },
];

const DATE_FORMAT_OPTIONS = [
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
];

const TIME_FORMAT_OPTIONS = [
  { label: '12 hour (hh:mm AM/PM)', value: '12h' },
  { label: '24 hour (HH:mm)', value: '24h' },
];

const CURRENCY_OPTIONS = [
  { label: 'BDT (৳)', value: 'BDT' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
];

const SYMBOL: Record<string, string> = { BDT: '৳', USD: '$', EUR: '€', GBP: '£' };

/** Today's date, time and a sample amount in the chosen formats. */
function useFormatPreview(s: GeneralSettingsType) {
  return useMemo(() => {
    const tz = s.timezone || 'Asia/Dhaka';
    let parts: Record<string, string> = {};
    try {
      parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        })
          .formatToParts(new Date())
          .map((p) => [p.type, p.value])
      );
    } catch {
      /* unknown time zone: fall back below */
    }
    const { day = '01', month = '01', year = '2026', hour = '00', minute = '00' } = parts;
    const date = (s.date_format || 'DD/MM/YYYY').replace('DD', day).replace('MM', month).replace('YYYY', year);
    const h = Number(hour);
    // '24h' is the option value; older data may hold a pattern such as 'HH:mm'.
    const time = /24|HH/.test(s.time_format || '') ? `${hour}:${minute}` : `${((h + 11) % 12) + 1}:${minute} ${h < 12 ? 'AM' : 'PM'}`;
    const money = `${SYMBOL[s.currency] ?? s.currency ?? ''}${(12345.5).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return { date, time, money, tz };
  }, [s.timezone, s.date_format, s.time_format, s.currency]);
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, onUpdate }) => {
  const { t } = useTranslations();
  const [localSettings, setLocalSettings] = useState<GeneralSettingsType>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const setValue = (name: string, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [name]: value as string }));
    onUpdate(name, value);
  };

  const preview = useFormatPreview(localSettings);

  const select = (name: keyof GeneralSettingsType, options: { label: string; value: string }[], fallback: string) => (
    <CustomSelect
      id={name}
      label=""
      name={name}
      setValue={setValue}
      value={localSettings[name] || fallback}
      options={options}
      model="Settings"
    />
  );

  return (
    <div className="space-y-5">
      {/* How the choices below will look */}
      <div className="grid gap-2 sm:grid-cols-3" aria-live="polite">
        {[
          { icon: CalendarDays, label: t('Date'), value: preview.date },
          { icon: Clock, label: t('Time'), value: `${preview.time}` },
          { icon: Coins, label: t('Amount'), value: preview.money },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="truncate font-mono text-sm font-medium tabular-nums text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <SettingsSection title={t('Language and region')}>
        <SettingRow label={t('Default language')} hint={t('Used when a person has not picked one.')}>
          {select('default_language', LANGUAGE_OPTIONS, 'en')}
        </SettingRow>
        <SettingRow label={t('Time zone')} hint={`${t('Now in')} ${preview.tz}: ${preview.time}`}>
          {select('timezone', TIMEZONE_OPTIONS, 'Asia/Dhaka')}
        </SettingRow>
      </SettingsSection>

      <SettingsSection title={t('Formats')}>
        <SettingRow label={t('Date format')} hint={preview.date}>
          {select('date_format', DATE_FORMAT_OPTIONS, 'DD/MM/YYYY')}
        </SettingRow>
        <SettingRow label={t('Time format')} hint={preview.time}>
          {select('time_format', TIME_FORMAT_OPTIONS, '12h')}
        </SettingRow>
        <SettingRow label={t('Currency')} hint={preview.money}>
          {select('currency', CURRENCY_OPTIONS, 'BDT')}
        </SettingRow>
      </SettingsSection>
    </div>
  );
};
