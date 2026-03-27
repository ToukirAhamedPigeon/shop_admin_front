import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import DateTimeInput, { CustomSelect } from '@/components/custom/FormInputs';
import { can } from '@/lib/authCheck';
import { useAppSelector } from '@/hooks/useRedux';
import { useTranslations } from '@/hooks/useTranslations';

const LOCAL_STORAGE_KEY = 'logFilters';

export interface LogFilters {
  collectionName?: string[];
  actionType?: string[];
  createdBy: string[];
  createdAtFrom?: Date | null;
  createdAtTo?: Date | null;
}

interface LogFilterFormProps {
  filterValues: LogFilters;
  setFilterValues: React.Dispatch<React.SetStateAction<LogFilters>>;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
  onClose?: () => void;
}

export function LogFilterForm({ filterValues, setFilterValues, onResetRef }: LogFilterFormProps) {

  const DEFAULT_LOG_FILTERS: LogFilters = {
    collectionName: [],
    actionType: [],
    createdBy: [],
    createdAtFrom: null,
    createdAtTo: null,
  };

  const hasReadAllPermission = can(['read-admin-all-user-logs']);
  const initialized = useRef(false);
  const user = useAppSelector((state) => state.auth.user);
  const { t } = useTranslations();
  const isResetting = useRef(false);

  const { watch, reset, setValue, formState: { errors } } = useForm<LogFilters>({
    defaultValues: {
      ...filterValues,
      createdAtFrom: filterValues.createdAtFrom ?? new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      createdAtTo: filterValues.createdAtTo ?? new Date(),
      // If user doesn't have read-all-logs permission, always set createdBy to their own ID
      createdBy: hasReadAllPermission
        ? filterValues.createdBy
        : [user?.id ?? ''],
    },
  });

  /* ----------------------------------------
   * Expose handleReset to modal via resetRef
   * -------------------------------------- */
  const handleReset = () => {
    isResetting.current = true;

    localStorage.removeItem(LOCAL_STORAGE_KEY);

    const resetValues = {
      ...DEFAULT_LOG_FILTERS,
      // If user doesn't have permission, always reset to their own ID
      createdBy: hasReadAllPermission ? [] : [user?.id ?? ''],
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
  }, [onResetRef]);

  /* ----------------------------------------
   * Load from localStorage (once)
   * -------------------------------------- */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const savedValues = JSON.parse(saved) as LogFilters;
        
        const merged: LogFilters = {
          ...filterValues,
          ...savedValues,
          createdAtFrom: savedValues.createdAtFrom ? new Date(savedValues.createdAtFrom) : new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
          createdAtTo: savedValues.createdAtTo ? new Date(savedValues.createdAtTo) : new Date(),
          // If user doesn't have read-all-logs permission, always use their own ID
          createdBy: hasReadAllPermission 
            ? (savedValues.createdBy || [])
            : [user?.id ?? ''],
        };
        
        reset(merged);
        setFilterValues(merged);
      } else {
        // Initialize with default values
        const defaultValues = {
          ...DEFAULT_LOG_FILTERS,
          createdBy: hasReadAllPermission ? [] : [user?.id ?? ''],
        };
        reset(defaultValues);
        setFilterValues(defaultValues);
      }
    } catch (err) {
      console.error('Failed to load filter values from localStorage:', err);
      const defaultValues = {
        ...DEFAULT_LOG_FILTERS,
        createdBy: hasReadAllPermission ? [] : [user?.id ?? ''],
      };
      reset(defaultValues);
      setFilterValues(defaultValues);
    }
  }, [filterValues, reset, setFilterValues, user, hasReadAllPermission]);

  /* ----------------------------------------
   * Sync on change
   * -------------------------------------- */
  useEffect(() => {
    const subscription = watch((values) => {
      if (isResetting.current) return;

      const cleaned: LogFilters = {
        ...values,
        collectionName: values.collectionName?.filter((v): v is string => typeof v === 'string'),
        actionType: values.actionType?.filter((v): v is string => typeof v === 'string'),
        createdBy: (values.createdBy ?? []).filter(
          (v): v is string => typeof v === 'string'
        ),
      };

      // If user doesn't have permission, ensure createdBy always contains their ID
      if (!hasReadAllPermission && user?.id) {
        cleaned.createdBy = [user.id];
      }

      setFilterValues((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(cleaned)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
        return prev;
      });
    });

    return () => subscription.unsubscribe();
  }, [watch, setFilterValues, hasReadAllPermission, user]);
  console.log(hasReadAllPermission)
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<LogFilters>
          id="collectionName"
          label="Collection Name"
          name="collectionName"
          apiUrl="/Options/userLogCollections"
          optionValueKey="value"
          optionLabelKeys={["label"]}
          multiple
          setValue={setValue}
          model="Log"
          value={watch("collectionName")}
          placeholder={t('Select Collection(s)')}
        />
        <CustomSelect<LogFilters>
          id="actionType"
          label="Action Type"
          name="actionType"
          apiUrl="/Options/userLogActionTypes"
          optionValueKey="value"
          optionLabelKeys={["label"]}
          multiple
          setValue={setValue}
          model="Log"
          value={watch("actionType")}
          placeholder={t('Select Action(s)')}
        />
      </div>

      {/* Only show Created By filter if user has read-all-logs permission */}
      {hasReadAllPermission && (
        <div className="flex flex-col md:flex-row gap-4">
          <CustomSelect<LogFilters>
            id="createdBy"
            label="Created By"
            name="createdBy"
            apiUrl="/Options/userLogCreators"
            optionValueKey="value"
            optionLabelKeys={["label"]}
            multiple
            setValue={setValue}
            model="Log"
            value={watch("createdBy")}
            placeholder={t('Select User(s)')}
            error={errors.createdBy?.[0]}
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <DateTimeInput
          id="createdAtFrom"
          label="From Date"
          name="createdAtFrom"
          value={watch('createdAtFrom') ?? new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
          setValue={(field, value) => setValue(field as keyof LogFilters, value)}
          error={errors.createdAtFrom}
          placeholder="Select start date"
          showTime={false}
          showResetButton
          model="Log"
        />

        <DateTimeInput
          id="createdAtTo"
          label="To Date"
          name="createdAtTo"
          value={watch('createdAtTo') ?? new Date()}
          setValue={(field, value) => setValue(field as keyof LogFilters, value)}
          error={errors.createdAtTo}
          placeholder="Select end date"
          showTime={false}
          showResetButton
          model="Log"
        />
      </div>
    </form>
  );
}