import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import DateTimeInput, { CustomSelect } from '@/components/custom/FormInputs';
import { can } from '@/lib/authCheck';
import { useAppSelector } from '@/hooks/useRedux';
import { useTranslations } from '@/hooks/useTranslations';

const LOCAL_STORAGE_KEY = 'userFilters';

export interface UserFilters {
  roleIds?: string[];
  permissionIds?: string[];
  status?: string[];
  createdBy?: string[];
  createdAtFrom?: Date | null;
  createdAtTo?: Date | null;
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
      createdAtFrom: filterValues.createdAtFrom ?? null,
      createdAtTo: filterValues.createdAtTo ?? null,
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
          createdAtFrom: parsed.createdAtFrom
            ? new Date(parsed.createdAtFrom)
            : null,
          createdAtTo: parsed.createdAtTo
            ? new Date(parsed.createdAtTo)
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
        status: values.status?.filter((v): v is string => typeof v === 'string'),
        createdBy: values.createdBy?.filter((v): v is string => typeof v === 'string'),
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
          apiUrl="/roles/options"
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
          apiUrl="/permissions/options"
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
          id="status"
          label="Status"
          name="status"
          apiUrl="/users/status-options"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('status')}
          placeholder={t('Select Status')}
        />
      </div>

      {hasReadAllPermission && (
        <CustomSelect<UserFilters>
          id="createdBy"
          label="Created By"
          name="createdBy"
          apiUrl="/users/creators"
          optionValueKey="value"
          optionLabelKeys={['label']}
          multiple
          setValue={setValue}
          model="User"
          value={watch('createdBy')}
          placeholder={t('Select User(s)')}
          error={errors.createdBy?.[0]}
        />
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <DateTimeInput
          id="createdAtFrom"
          label="From Date"
          name="createdAtFrom"
          value={watch('createdAtFrom') ?? null}
          setValue={(field, value) =>
            setValue(field as keyof UserFilters, value)
          }
          error={errors.createdAtFrom}
          placeholder="Select start date"
          showTime={false}
          showResetButton
          model="User"
        />

        <DateTimeInput
          id="createdAtTo"
          label="To Date"
          name="createdAtTo"
          value={watch('createdAtTo') ?? null}
          setValue={(field, value) =>
            setValue(field as keyof UserFilters, value)
          }
          error={errors.createdAtTo}
          placeholder="Select end date"
          showTime={false}
          showResetButton
          model="User"
        />
      </div>
    </form>
  );
}
