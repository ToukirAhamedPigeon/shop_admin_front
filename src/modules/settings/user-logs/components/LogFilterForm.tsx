
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

  const hasReadAllPermission = can(['read-all-logs']);
  const initialized = useRef(false);
  const user = useAppSelector((state) => state.auth.user);
  const { t } = useTranslations();
  const isResetting = useRef(false);

  const { watch, reset, setValue, formState: { errors } } = useForm<LogFilters>({
    defaultValues: {
      ...filterValues,
      createdAtFrom: filterValues.createdAtFrom ?? new Date(),
      createdAtTo: filterValues.createdAtTo ?? new Date(),
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

    reset({
      ...DEFAULT_LOG_FILTERS,
      createdBy: hasReadAllPermission ? [] : [user?.id ?? ''],
    });

    setFilterValues({
      ...DEFAULT_LOG_FILTERS,
      createdBy: hasReadAllPermission ? [] : [user?.id ?? ''],
    });

    setTimeout(() => {
      isResetting.current = false;
    }, 0);
  };

  useEffect(() => {
    if (onResetRef) { // 🔹 assign form's handleReset to resetRef
      onResetRef.current = handleReset;
    }
  }, [onResetRef]);

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
          createdAtFrom: savedValues.createdAtFrom ? new Date(savedValues.createdAtFrom) : new Date(),
          createdAtTo: savedValues.createdAtTo ? new Date(savedValues.createdAtTo) : new Date(),
          createdBy: hasReadAllPermission ? savedValues.createdBy : [user?.id ?? ''],
        };
        reset(merged);
        setFilterValues(merged);
      } else reset();
    } catch (err) {
      console.error('Failed to load filter values from localStorage:', err);
    }
  }, [filterValues, reset, setFilterValues, user, hasReadAllPermission]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (isResetting.current) return; // 🔑 IMPORTANT

      const cleaned: LogFilters = {
        ...values,
        collectionName: values.collectionName?.filter((v): v is string => typeof v === 'string'),
        actionType: values.actionType?.filter((v): v is string => typeof v === 'string'),
        createdBy: (values.createdBy ?? []).filter(
          (v): v is string => typeof v === 'string'
        ),
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
        />
      </div>

      {hasReadAllPermission && (
        <CustomSelect<LogFilters>
          id="createdBy"
          label="Created By"
          name="createdBy"
          setValue={setValue}
          model="User"
          apiUrl="/get-options"
          collection="User"
          labelFields={['name']}
          valueFields={['_id']}
          sortOrder="asc"
          isRequired={false}
          placeholder="Select User(s)"
          multiple
          value={watch('createdBy')}
          error={errors.createdBy?.[0]}
        />
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <DateTimeInput
          id="createdAtFrom"
          label="From Date"
          name="createdAtFrom"
          value={watch('createdAtFrom') ?? new Date()}
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
