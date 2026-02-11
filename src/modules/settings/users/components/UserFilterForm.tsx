import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import DateTimeInput, { CustomSelect } from '@/components/custom/FormInputs';
import { can } from '@/lib/authCheck';
import { useAppSelector } from '@/hooks/useRedux';
import { useTranslations } from '@/hooks/useTranslations';
import { BOOLEAN_OPTIONS, GENDER_OPTIONS } from '@/constants';

const LOCAL_STORAGE_KEY = 'userFilters';

export interface UserFilters {
  roles?: string[];
  permissions?: string[];
  isActiveStr?: string;
  isDeletedStr?: string;
  createdBy?: string[];
  updatedBy?: string[];
  gender?: string[];
  dateType?: string[];
  from?: Date | null;
  to?: Date | null;
}

interface UserFilterFormProps {
  filterValues: UserFilters;
  setFilterValues: React.Dispatch<React.SetStateAction<UserFilters>>;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
  onClose?: () => void;
}

export function UserFilterForm({
  filterValues,
  setFilterValues,
  onResetRef,
}: UserFilterFormProps) {
  const initialized = useRef(false);
  const user = useAppSelector((state) => state.auth.user);
  const hasReadAllPermission = can(['read-admin-dashboard']);
  const { t } = useTranslations();
  const isResetting = useRef(false);

  const DEFAULT_USER_FILTERS: UserFilters = {
    roles: [],
    permissions: [],
    isActiveStr: 'true',
    isDeletedStr: 'false',
    createdBy: [],
    updatedBy: [],
    gender: [],
    dateType: [],
    from: null,
    to: null,
 };


  const {
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFilters>({
    defaultValues: {
      ...filterValues,
      from: filterValues.from ?? null,
      to: filterValues.to ?? null,
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
      ...DEFAULT_USER_FILTERS,
      createdBy: hasReadAllPermission ? [] : [user?.id ?? ''],
    });

    setFilterValues({
      ...DEFAULT_USER_FILTERS,
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

  /* ----------------------------------------
   * Load from localStorage (once)
   * -------------------------------------- */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserFilters;

        const merged: UserFilters = {
          ...filterValues,
          ...parsed,
          from: parsed.from
            ? new Date(parsed.from)
            : null,
          to: parsed.to
            ? new Date(parsed.to)
            : null,
          createdBy: hasReadAllPermission
            ? parsed.createdBy
            : [user?.id ?? ''],
        };

        reset(merged);
        setFilterValues(merged);
      }
    } catch (err) {
      console.error('Failed to load user filters:', err);
    }
  }, [filterValues, reset, setFilterValues, user, hasReadAllPermission]);

  /* ----------------------------------------
   * Sync on change
   * -------------------------------------- */
  useEffect(() => {
    const subscription = watch((values) => {
      if (isResetting.current) return; // 🔑 IMPORTANT

      const cleaned: UserFilters = {
        ...values,
        roles: values.roles?.filter((v): v is string => typeof v === 'string'),
        permissions: values.permissions?.filter((v): v is string => typeof v === 'string'),
        isActiveStr:
          typeof values.isActiveStr === 'string'
            ? values.isActiveStr
            : values.isActiveStr?.[0] ?? 'true',
        isDeletedStr:
          typeof values.isDeletedStr === 'string'
            ? values.isDeletedStr
            : values.isDeletedStr?.[0] ?? 'false',
        gender: values.gender?.filter((v): v is string => typeof v === 'string'),
        dateType: values.dateType?.filter((v): v is string => typeof v === 'string'),
        createdBy: values.createdBy?.filter((v): v is string => typeof v === 'string'),
        updatedBy: values.updatedBy?.filter((v): v is string => typeof v === 'string'),
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
        <CustomSelect<UserFilters>
          id="roleIds"
          label="Roles"
          name="roles"
          apiUrl="/Options/roles"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('roles')}
          placeholder={t('Select Role(s)')}
        />

        <CustomSelect<UserFilters>
          id="permissions"
          label="Permissions"
          name="permissions"
          apiUrl="/Options/permissions"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('permissions')}
          placeholder={t('Select Permission(s)')}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<UserFilters>
          id="isActive"
          label="Is Active?"
          name="isActiveStr"
          options={BOOLEAN_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false} // single-select
          setValue={setValue}
          model="User"
          value={watch('isActiveStr') || 'true'} // default Yes
          placeholder={t('Is Active?')}
        />

        <CustomSelect<UserFilters>
          id="isDeleted"
          label="Is Deleted?"
          name="isDeletedStr"
          options={BOOLEAN_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false} // single-select
          setValue={setValue}
          model="User"
          value={watch('isDeletedStr') || 'false'} // default No
          placeholder={t('Is Deleted?')}
        />

        <CustomSelect<UserFilters>
          id="gender"
          label="Gender"
          name="gender"
          options={GENDER_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple // single-select
          setValue={setValue}
          model="User"
          value={watch('gender')} // default Male
          placeholder={t('Gender')}
        />
      </div>

      {hasReadAllPermission && (
      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<UserFilters>
          id="createdBy"
          label="Created By"
          name="createdBy"
          apiUrl="/Options/userCreators"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('createdBy')}
          placeholder={t('Select User(s)')}
          error={errors.createdBy?.[0]}
        />
        <CustomSelect<UserFilters>
          id="updatedBy"
          label="Last Updated By"
          name="updatedBy"
          apiUrl="/Options/userUpdaters"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('updatedBy')}
          placeholder={t('Select User(s)')}
          error={errors.updatedBy?.[0]}
        />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<UserFilters>
          id="dateType"
          label="Date Type"
          name="dateType"
          apiUrl="/Options/userDateTypes"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('dateType')}
          placeholder={t('Select Date Types')}
        />
        <DateTimeInput
          id="from"
          label="From Date"
          name="from"
          value={watch('from') ?? null}
          setValue={(field, value) =>
            setValue(field as keyof UserFilters, value)
          }
          error={errors.from}
          placeholder="Select start date"
          showTime={false}
          showResetButton
          model="User"
        />

        <DateTimeInput
          id="to"
          label="To Date"
          name="to"
          value={watch('to') ?? null}
          setValue={(field, value) =>
            setValue(field as keyof UserFilters, value)
          }
          error={errors.to}
          placeholder="Select end date"
          showTime={false}
          showResetButton
          model="User"
        />
      </div>
    </form>
  );
}
