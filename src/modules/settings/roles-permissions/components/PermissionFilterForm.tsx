import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { CustomSelect } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';

const LOCAL_STORAGE_KEY = 'permissionFilters';

export interface PermissionFilters {
  isActiveStr?: string;
  isDeletedStr?: string;
  roles?: string[];
}

interface PermissionFilterFormProps {
  filterValues: PermissionFilters;
  setFilterValues: React.Dispatch<React.SetStateAction<PermissionFilters>>;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
  onClose?: () => void;
}

export default function PermissionFilterForm({
  filterValues,
  setFilterValues,
  onResetRef,
  onClose,
}: PermissionFilterFormProps) {
  const initialized = useRef(false);
  const { t } = useTranslations();
  const isResetting = useRef(false);

  const DEFAULT_PERMISSION_FILTERS: PermissionFilters = {
    isActiveStr: 'all',
    isDeletedStr: 'false',
    roles: [],
  };

  const ACTIVE_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' }
  ];

  const DELETED_OPTIONS = [
    { label: 'No', value: 'false' },
    { label: 'Yes', value: 'true' }
  ];

  const {
    watch,
    reset,
    setValue,
  } = useForm<PermissionFilters>({
    defaultValues: filterValues,
  });

  const handleReset = () => {
    isResetting.current = true;

    localStorage.removeItem(LOCAL_STORAGE_KEY);

    reset(DEFAULT_PERMISSION_FILTERS);

    setFilterValues(DEFAULT_PERMISSION_FILTERS);

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
        const parsed = JSON.parse(saved) as PermissionFilters;
        const merged = {
          ...DEFAULT_PERMISSION_FILTERS,
          ...filterValues,
          ...parsed,
        };
        reset(merged);
        setFilterValues(merged);
      }
    } catch (err) {
      console.error('Failed to load permission filters:', err);
    }
  }, [filterValues, reset, setFilterValues]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (isResetting.current) return;

      const cleaned: PermissionFilters = {
        isActiveStr: values.isActiveStr || 'all',
        isDeletedStr: values.isDeletedStr || 'false',
        roles: values.roles?.filter((v): v is string => typeof v === 'string') || [],
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
        <CustomSelect<PermissionFilters>
          id="isActive"
          label="Is Active?"
          name="isActiveStr"
          options={ACTIVE_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false}
          setValue={setValue}
          model="Permission"
          value={watch('isActiveStr') || 'all'}
          placeholder={t('Select Status')}
        />

        <CustomSelect<PermissionFilters>
          id="isDeleted"
          label="Is Deleted?"
          name="isDeletedStr"
          options={DELETED_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false}
          setValue={setValue}
          model="Permission"
          value={watch('isDeletedStr') || 'false'}
          placeholder={t('Select Deleted Status')}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<PermissionFilters>
          id="roles"
          label="Roles"
          name="roles"
          apiUrl="/Options/roles"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="Permission"
          value={watch('roles')}
          placeholder={t('Select Role(s)')}
        />
      </div>
    </form>
  );
}