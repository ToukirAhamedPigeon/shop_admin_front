import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { CustomSelect } from '@/components/custom/FormInputs';
import DateTimeInput from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';

const LOCAL_STORAGE_KEY = 'translationFilters';

export interface TranslationFilters {
  startDate?: string | null;
  endDate?: string | null;
  modules?: string[];
}

interface TranslationFilterFormProps {
  filterValues: TranslationFilters;
  setFilterValues: React.Dispatch<React.SetStateAction<TranslationFilters>>;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
  onClose?: () => void;
}

export default function TranslationFilterForm({
  filterValues,
  setFilterValues,
  onResetRef,
  onClose,
}: TranslationFilterFormProps) {
  const initialized = useRef(false);
  const { t } = useTranslations();
  const isResetting = useRef(false);

  const DEFAULT_FILTERS: TranslationFilters = {
    startDate: null,
    endDate: null,
    modules: [],
  };

  const {
    watch,
    reset,
    setValue,
  } = useForm<TranslationFilters>({
    defaultValues: filterValues,
  });

  const handleReset = () => {
    isResetting.current = true;

    localStorage.removeItem(LOCAL_STORAGE_KEY);

    reset(DEFAULT_FILTERS);

    setFilterValues(DEFAULT_FILTERS);

    setTimeout(() => {
      isResetting.current = false;
    }, 0);
  };

  useEffect(() => {
    if (onResetRef) {
      onResetRef.current = handleReset;
    }
  }, [onResetRef]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TranslationFilters;
        const merged = {
          ...DEFAULT_FILTERS,
          ...filterValues,
          ...parsed,
        };
        reset(merged);
        setFilterValues(merged);
      }
    } catch (err) {
      console.error('Failed to load translation filters:', err);
    }
  }, [filterValues, reset, setFilterValues]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (isResetting.current) return;

      const cleaned: TranslationFilters = {
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        modules: values.modules?.filter((v): v is string => typeof v === 'string') || [],
      };

      setFilterValues((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(cleaned)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
        return prev;
      });
    });

    return () => subscription.unsubscribe();
  }, [watch, setFilterValues]);

  const handleDateChange = (field: string, value: Date | null) => {
    setValue(field as any, value ? value.toISOString() : null);
  };

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col md:flex-row gap-4">
        <DateTimeInput
          id="startDate"
          label="From Date"
          model="Translation"
          name="startDate"
          value={watch('startDate') ? new Date(watch('startDate')!) : null}
          setValue={handleDateChange}
          placeholder={t('Select start date')}
          showTime={false}
          showResetButton={true}
        />

        <DateTimeInput
          id="endDate"
          label="To Date"
          model="Translation"
          name="endDate"
          value={watch('endDate') ? new Date(watch('endDate')!) : null}
          setValue={handleDateChange}
          placeholder={t('Select end date')}
          showTime={false}
          showResetButton={true}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<TranslationFilters>
          id="modules"
          label="Modules"
          name="modules"
          apiUrl="/options/translationModules"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="Translation"
          value={watch('modules')}
          placeholder={t('Select Module(s)')}
        />
      </div>
    </form>
  );
}