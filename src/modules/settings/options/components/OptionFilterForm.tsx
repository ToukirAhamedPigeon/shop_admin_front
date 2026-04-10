import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import DateTimeInput, { CustomSelect } from '@/components/custom/FormInputs';
import { useTranslations } from '@/hooks/useTranslations';
import { getParentOptions } from '../api';

const LOCAL_STORAGE_KEY = 'optionFilters';

export interface OptionFilters {
  isActiveStr?: string;
  isDeletedStr?: string;
  parentId?: string | null;
  createdFrom?: string;
  createdTo?: string;
}

interface OptionFilterFormProps {
  filterValues: OptionFilters;
  setFilterValues: React.Dispatch<React.SetStateAction<OptionFilters>>;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
  onClose?: () => void;
  showTrash?: boolean;
  onShowTrashChange?: (showTrash: boolean) => void;
}

export default function OptionFilterForm({
  filterValues,
  setFilterValues,
  onResetRef,
  onClose,
  showTrash = false,
  onShowTrashChange,
}: OptionFilterFormProps) {
  const initialized = useRef(false);
  const { t } = useTranslations();
  const isResetting = useRef(false);
  const [parentOptions, setParentOptions] = useState<{ value: string; label: string }[]>([]);

  const DEFAULT_OPTION_FILTERS: OptionFilters = {
    isActiveStr: 'all',
    isDeletedStr: showTrash ? 'true' : 'false',
    parentId: 'all', // Default to 'all' instead of null
    createdFrom: undefined,
    createdTo: undefined,
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

  // Parent filter options with "All", "No Parent", and actual parents
  const PARENT_FILTER_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'No Parent', value: 'null' },
  ];

  // Fetch parent options for filter dropdown
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const parents = await getParentOptions();
        // Add actual parent options
        const actualParents = parents.map((p: any) => ({ 
          value: p.value, 
          label: p.label 
        }));
        setParentOptions([...PARENT_FILTER_OPTIONS, ...actualParents]);
      } catch (error) {
        console.error('Failed to fetch parent options:', error);
        // Even if fetch fails, still provide "All" and "No Parent" options
        setParentOptions(PARENT_FILTER_OPTIONS);
      }
    };
    fetchParents();
  }, []);

  const {
    watch,
    reset,
    setValue,
  } = useForm<OptionFilters>({
    defaultValues: filterValues,
  });

  const handleReset = () => {
    isResetting.current = true;

    localStorage.removeItem(LOCAL_STORAGE_KEY);

    const resetValues = {
      ...DEFAULT_OPTION_FILTERS,
      isDeletedStr: showTrash ? 'true' : 'false',
      parentId: 'all',
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
        const parsed = JSON.parse(saved) as OptionFilters;
        const merged = {
          ...DEFAULT_OPTION_FILTERS,
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
      console.error('Failed to load option filters:', err);
    }
  }, [filterValues, reset, setFilterValues]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (isResetting.current) return;

      const cleaned: OptionFilters = {
        isActiveStr: values.isActiveStr || 'all',
        isDeletedStr: values.isDeletedStr || (showTrash ? 'true' : 'false'),
        parentId: values.parentId || 'all',
        createdFrom: values.createdFrom,
        createdTo: values.createdTo,
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

  // Helper function to handle date changes that matches DateTimeInput's expected signature
  const handleDateChange = (field: string, value: any, options?: object) => {
    if (value) {
      // Convert Date to ISO string date part
      const dateStr = value instanceof Date ? value.toISOString().split('T')[0] : value;
      setValue(field as any, dateStr, options);
    } else {
      setValue(field as any, undefined, options);
    }
  };

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<OptionFilters>
          id="isActive"
          label="Is Active?"
          name="isActiveStr"
          options={ACTIVE_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false}
          setValue={setValue}
          model="Option"
          value={watch('isActiveStr') || 'all'}
          placeholder={t('Select Status')}
        />

        <CustomSelect<OptionFilters>
          id="isDeleted"
          label="Is Deleted?"
          name="isDeletedStr"
          options={DELETED_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false}
          setValue={setValue}
          model="Option"
          value={watch('isDeletedStr') || (showTrash ? 'true' : 'false')}
          placeholder={t('Select Deleted Status')}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<OptionFilters>
          id="parentId"
          label="Parent Option"
          name="parentId"
          options={parentOptions}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false}
          setValue={setValue}
          model="Option"
          value={watch('parentId') || 'all'}
          placeholder={t('Select Parent Option')}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <DateTimeInput
          id="createdFrom"
          label="Created From"
          name="createdFrom"
          value={watch('createdFrom') ? new Date(watch('createdFrom')!) : null}
          setValue={handleDateChange}
          placeholder="Select start date"
          model="Option"
        />

        <DateTimeInput
          id="createdTo"
          label="Created To"
          name="createdTo"
          value={watch('createdTo') ? new Date(watch('createdTo')!) : null}
          setValue={handleDateChange}
          placeholder="Select end date"
          model="Option"
        />
      </div>
    </form>
  );
}