import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import DateTimeInput, { CustomSelect } from '@/components/custom/FormInputs';
import { can } from '@/lib/authCheck';
import { useAppSelector } from '@/hooks/useRedux';
import { useTranslations } from '@/hooks/useTranslations';
import { BOOLEAN_OPTIONS, GENDER_OPTIONS } from '@/constants';

const LOCAL_STORAGE_KEY = 'userFilters';

export interface UserFilters {
  roleIds?: string[];
  permissionIds?: string[];
  isActive?: string;
  isDeleted?: string;
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
  onClose?: () => void;
}

export function UserFilterForm({
  filterValues,
  setFilterValues,
}: UserFilterFormProps) {
  const initialized = useRef(false);
  const user = useAppSelector((state) => state.auth.user);
  const hasReadAllPermission = can(['read-admin-dashboard']);
  const { t } = useTranslations();

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
      const cleaned: UserFilters = {
        ...values,
        roleIds: values.roleIds?.filter((v): v is string => typeof v === 'string'),
        permissionIds: values.permissionIds?.filter((v): v is string => typeof v === 'string'),
        isActive: typeof values.isActive === 'string' ? values.isActive : values.isActive?.[0] ?? 'true',
        isDeleted: typeof values.isDeleted === 'string' ? values.isDeleted : values.isDeleted?.[0] ?? 'false',
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
          name="roleIds"
          apiUrl="/Options/roles"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('roleIds')}
          placeholder={t('Select Role(s)')}
        />

        <CustomSelect<UserFilters>
          id="permissionIds"
          label="Permissions"
          name="permissionIds"
          apiUrl="/Options/permissions"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('permissionIds')}
          placeholder={t('Select Permission(s)')}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <CustomSelect<UserFilters>
          id="isActive"
          label="Is Active?"
          name="isActive"
          options={BOOLEAN_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false} // single-select
          setValue={setValue}
          model="User"
          value={watch('isActive') || 'true'} // default Yes
          placeholder={t('Is Active?')}
        />

        <CustomSelect<UserFilters>
          id="isDeleted"
          label="Is Deleted?"
          name="isDeleted"
          options={BOOLEAN_OPTIONS}
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple={false} // single-select
          setValue={setValue}
          model="User"
          value={watch('isDeleted') || 'false'} // default No
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
