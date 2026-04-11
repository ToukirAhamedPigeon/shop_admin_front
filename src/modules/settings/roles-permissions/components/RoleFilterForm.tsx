import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { CustomSelect } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';

const LOCAL_STORAGE_KEY = 'roleFilters';

export interface RoleFilters {
  isActiveStr?: string;
  isDeletedStr?: string;
  permissions?: string[];
}

interface RoleFilterFormProps {
  filterValues: RoleFilters;
  setFilterValues: React.Dispatch<React.SetStateAction<RoleFilters>>;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
  onClose?: () => void;
  showTrash?: boolean;
  onShowTrashChange?: (showTrash: boolean) => void;
}

export default function RoleFilterForm({
  filterValues,
  setFilterValues,
  onResetRef,
  onClose,
  showTrash = false,
  onShowTrashChange,
}: RoleFilterFormProps) {
  const initialized = useRef(false);
  const { t } = useTranslations();
  const isResetting = useRef(false);

  const DEFAULT_ROLE_FILTERS: RoleFilters = {
    isActiveStr: 'all',
    isDeletedStr: showTrash ? 'true' : 'false',
    permissions: [],
  };

  const ACTIVE_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' }
  ];

  const DELETED_OPTIONS = [
    { label: 'No (Store)', value: 'false' },
    { label: 'Yes (Trash)', value: 'true' }
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

    const resetValues = {
      ...DEFAULT_ROLE_FILTERS,
      isDeletedStr: showTrash ? 'true' : 'false',
    };
    reset(resetValues);

    setFilterValues(resetValues);

    setTimeout(() => {
      isResetting.current = false;
    }, 0);
  };

  useEffect(() => {
    if (onResetRef) {
      onResetRef.current = handleReset;
    }
  }, [onResetRef, showTrash]);

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
        
        // Sync trash view if needed
        if (onShowTrashChange && merged.isDeletedStr === 'true') {
          onShowTrashChange(true);
        } else if (onShowTrashChange && merged.isDeletedStr === 'false') {
          onShowTrashChange(false);
        }
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
        isDeletedStr: values.isDeletedStr || (showTrash ? 'true' : 'false'),
        permissions: values.permissions?.filter((v): v is string => typeof v === 'string') || [],
      };

      setFilterValues((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(cleaned)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
        return prev;
      });
      
      // Sync trash view when filter changes
      if (onShowTrashChange && cleaned.isDeletedStr === 'true' && !showTrash) {
        onShowTrashChange(true);
      } else if (onShowTrashChange && cleaned.isDeletedStr === 'false' && showTrash) {
        onShowTrashChange(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setFilterValues, showTrash, onShowTrashChange]);

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
          value={watch('isDeletedStr') || (showTrash ? 'true' : 'false')}
          placeholder={t('Select Deleted Status')}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<RoleFilters>
          id="permissions"
          label="Permissions"
          name="permissions"
          apiUrl="/Options/permissions"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="Role"
          value={watch('permissions')}
          placeholder={t('Select Permission(s)')}
        />
      </div>
    </form>
  );
}