import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { CustomSelect } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';

const LOCAL_STORAGE_KEY = 'roleFilters';

export interface RoleFilters {
  isActiveStr?: string;
  isDeletedStr?: string;
}

interface RoleFilterFormProps {
  filterValues: RoleFilters;
  setFilterValues: React.Dispatch<React.SetStateAction<RoleFilters>>;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
  onClose?: () => void;
}

export function RoleFilterForm({
  filterValues,
  setFilterValues,
  onResetRef,
  onClose,
}: RoleFilterFormProps) {
  const initialized = useRef(false);
  const { t } = useTranslations();
  const isResetting = useRef(false);

  const DEFAULT_ROLE_FILTERS: RoleFilters = {
    isActiveStr: 'all',  // Default to "All" instead of "true"
    isDeletedStr: 'false',
  };

  // Options for isActive with "All" option
  const ACTIVE_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' }
  ];

  // Options for isDeleted (only Yes/No since we don't need "All" for deleted filter)
  const DELETED_OPTIONS = [
    { label: 'No', value: 'false' },
    { label: 'Yes', value: 'true' }
  ];

  const {
    watch,
    reset,
    setValue,
  } = useForm<RoleFilters>({
    defaultValues: filterValues,
  });

  const handleReset = () => {
    isResetting.current = true;

    localStorage.removeItem(LOCAL_STORAGE_KEY);

    reset(DEFAULT_ROLE_FILTERS);

    setFilterValues(DEFAULT_ROLE_FILTERS);

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
        const parsed = JSON.parse(saved) as RoleFilters;
        const merged = {
          ...DEFAULT_ROLE_FILTERS,
          ...filterValues,
          ...parsed,
        };
        reset(merged);
        setFilterValues(merged);
      }
    } catch (err) {
      console.error('Failed to load role filters:', err);
    }
  }, [filterValues, reset, setFilterValues]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (isResetting.current) return;

      const cleaned: RoleFilters = {
        isActiveStr: values.isActiveStr || 'all',
        isDeletedStr: values.isDeletedStr || 'false',
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

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<RoleFilters>
          id="isActive"
          label="Is Active?"
          name="isActiveStr"
          options={ACTIVE_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false}
          setValue={setValue}
          model="Role"
          value={watch('isActiveStr') || 'all'}
          placeholder={t('Select Status')}
        />

        <CustomSelect<RoleFilters>
          id="isDeleted"
          label="Is Deleted?"
          name="isDeletedStr"
          options={DELETED_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false}
          setValue={setValue}
          model="Role"
          value={watch('isDeletedStr') || 'false'}
          placeholder={t('Select Deleted Status')}
        />
      </div>
    </form>
  );
}