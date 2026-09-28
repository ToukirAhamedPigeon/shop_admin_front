// src/modules/settings/roles-permissions/components/AccessForm.tsx
// Add and edit for both roles and permissions. The two have the same shape
// (names, guard, active) and each links to the other: a role holds
// permissions, a permission belongs to roles.
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, KeyRound, Loader2, PlusCircle, RotateCcw, Save, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BasicInput } from '@/components/custom/FormInputs'
import { FieldGrid, FormSection, FormSkeleton, SheetFooter, SwitchField } from '@/components/custom/FormKit'
import ChipSelect from '@/components/custom/ChipSelect'
import { useTranslations } from '@/hooks/useTranslations'
import { useRefreshAuth } from '@/hooks/useRefreshAuth'
import { useAppSelector } from '@/hooks/useRedux'
import { invalidateOptionNames } from '@/hooks/useOptionNames'
import { dispatchShowToast } from '@/lib/dispatch'
import type { IPermission, IRole } from '@/types/role-permission'
import { createPermission, createRole, getPermissionForEdit, getRoleForEdit, updatePermission, updateRole } from '../api'
import NamesField from './NamesField'
import PermissionPicker from './PermissionPicker'
import { moduleLabel, parsePermission, splitNames } from './permissionMeta'

type Kind = 'role' | 'permission'

type Values = { names: string; guardName: string; links: string[]; isActive: string }

const EMPTY: Values = { names: '', guardName: 'admin', links: [], isActive: 'true' }

const schemaFor = (kind: Kind, isEdit: boolean) =>
  z.object({
    names: z
      .string()
      .min(1, kind === 'role' ? (isEdit ? 'Role name is required' : 'Role name(s) are required') : isEdit ? 'Permission name is required' : 'Permission name(s) are required'),
    guardName: z.string().min(1, 'Guard name is required'),
    links: z.array(z.string()),
    isActive: z.string(),
  })

type Props = {
  kind: Kind
  fetchData: () => Promise<void>
  onClose: () => void
  /** Set to edit that role or permission; leave out to create. */
  id?: string
}

export default function AccessForm({ kind, id, fetchData, onClose }: Props) {
  const isEdit = !!id
  const isRole = kind === 'role'
  const { t } = useTranslations()
  const { refreshUser } = useRefreshAuth()
  const currentUser = useAppSelector((s) => s.auth.user)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef<Values>(EMPTY)

  const { register, handleSubmit, setValue, reset, control, formState } = useForm<Values>({
    resolver: zodResolver(schemaFor(kind, isEdit)),
    defaultValues: EMPTY,
  })
  const { errors, isDirty } = formState
  const values = useWatch({ control }) as Values

  const loadedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!id || loadedFor.current === id) return
    loadedFor.current = id
    setLoading(true)
    const request = isRole ? getRoleForEdit(id) : getPermissionForEdit(id)
    request
      .then((item: IRole | IPermission) => {
        const loaded: Values = {
          names: item.name,
          guardName: item.guardName,
          links: (isRole ? (item as IRole).permissions : (item as IPermission).roles) || [],
          isActive: item.isActive ? 'true' : 'false',
        }
        loadedRef.current = loaded
        reset(loaded)
      })
      .catch((error) => {
        console.error(error)
        dispatchShowToast({ type: 'danger', message: t(isRole ? 'Failed to load role data' : 'Failed to load permission data') })
      })
      .finally(() => setLoading(false))
  }, [id, isRole, reset, t])

  const setField = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValue(key, value as never, { shouldDirty: true, shouldValidate: !!errors[key] })

  const onSubmit = async (data: Values) => {
    setSaving(true)
    try {
      if (isRole) {
        if (isEdit) await updateRole(id!, { name: data.names, guardName: data.guardName, permissions: data.links, isActive: data.isActive })
        else await createRole({ names: data.names, guardName: data.guardName, permissions: data.links, isActive: data.isActive })
      } else {
        if (isEdit) await updatePermission(id!, { name: data.names, guardName: data.guardName, roles: data.links, isActive: data.isActive })
        else await createPermission({ names: data.names, guardName: data.guardName, roles: data.links, isActive: data.isActive })
      }
      invalidateOptionNames(isRole ? '/Options/roles' : '/Options/permissions')

      // Editing something the signed-in user has changes what they can do.
      if (isEdit) {
        const mine = isRole ? currentUser?.roles ?? [] : (currentUser?.permissions as string[] | undefined) ?? []
        if (mine.includes(data.names) || mine.includes(loadedRef.current.names)) await refreshUser()
      }

      dispatchShowToast({
        type: 'success',
        message: t(
          isRole
            ? isEdit ? 'Role updated successfully' : 'Role(s) created successfully'
            : isEdit ? 'Permission updated successfully' : 'Permission(s) created successfully'
        ),
      })
      reset(EMPTY)
      await fetchData()
      onClose()
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } } }
      dispatchShowToast({
        type: 'danger',
        message:
          e.response?.data?.message ||
          t(isRole ? (isEdit ? 'Failed to update role' : 'Failed to create role(s)') : isEdit ? 'Failed to update permission' : 'Failed to create permission(s)'),
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <FormSkeleton sections={2} />

  const model = isRole ? 'Role' : 'Permission'
  const noun = isRole ? 'role' : 'permission'
  const count = splitNames(values.names ?? '').length
  const privileged = isRole && /admin|super|developer/i.test(values.names ?? '')
  const describePermission = (name: string) => {
    const { action, module } = parsePermission(name)
    return name.split('-').length >= 3 ? `${action} · ${moduleLabel(module)}` : undefined
  }

  const status = isEdit ? (
    isDirty ? (
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-warning" />
        {t('Unsaved changes')}
      </span>
    ) : (
      t('No changes yet')
    )
  ) : count > 0 ? (
    `${count} ${t(count === 1 ? noun : noun + 's')} ${t('will be created')}`
  ) : (
    t('Enter at least one name')
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormSection
        icon={isRole ? Shield : KeyRound}
        title={isRole ? t('Role') : t('Permission')}
        description={
          isRole
            ? t('A named set of permissions you give to users.')
            : t('Names read as action-scope-module, e.g. read-admin-users.')
        }
      >
        <div className="space-y-4">
          {isEdit ? (
            <BasicInput
              id="names"
              label={isRole ? 'Role Name' : 'Permission Name'}
              isRequired
              placeholder={isRole ? 'e.g., Editor' : 'e.g., read-admin-users'}
              register={register('names')}
              error={errors.names}
              model={model}
            />
          ) : (
            <NamesField
              id="names"
              label={isRole ? 'Role Names' : 'Permission Names'}
              placeholder={isRole ? 'e.g., Admin=Editor=Viewer' : 'e.g., create-admin-users=update-admin-users'}
              register={register('names')}
              error={errors.names}
              model={model}
              value={values.names ?? ''}
              noun={noun}
              describe={isRole ? undefined : describePermission}
            />
          )}
          <FieldGrid>
            <BasicInput
              id="guardName"
              label="Guard Name"
              isRequired
              placeholder="e.g., admin, web, api"
              register={register('guardName')}
              error={errors.guardName}
              model={model}
            />
            <SwitchField
              className="self-end"
              label={t('Active')}
              description={values.isActive === 'false' ? t('Not in effect') : t('In effect')}
              checked={values.isActive !== 'false'}
              onChange={(on) => setField('isActive', on ? 'true' : 'false')}
            />
          </FieldGrid>
          {privileged && (
            <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
              <AlertTriangle className="mt-px size-4 shrink-0 text-warning" />
              {t('This looks like a privileged role. Changes may impact security settings.')}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        icon={isRole ? KeyRound : Users}
        title={isRole ? t('Permissions') : t('Roles')}
        description={
          isRole
            ? isEdit
              ? t('Changes apply to everyone who has this role.')
              : t('Everyone given this role gets these.')
            : t('Roles that include this permission.')
        }
      >
        {isRole ? (
          <PermissionPicker id="permissions" label="Assigned permissions" value={values.links ?? []} onChange={(v) => setField('links', v)} />
        ) : (
          <ChipSelect id="roles" label="Roles" url="/Options/roles" value={values.links ?? []} onChange={(v) => setField('links', v)} />
        )}
      </FormSection>

      <SheetFooter status={status}>
        <Button type="button" variant="ghost" onClick={() => reset(isEdit ? loadedRef.current : EMPTY)} disabled={saving || (isEdit && !isDirty)}>
          <RotateCcw className="size-4" />
          {t('Reset')}
        </Button>
        <Button type="submit" disabled={saving || (isEdit && !isDirty)}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? <Save className="size-4" /> : <PlusCircle className="size-4" />}
          {saving
            ? `${t(isEdit ? 'Updating' : 'Creating')}…`
            : isEdit
              ? t('Save changes')
              : t(isRole ? (count > 1 ? 'Create roles' : 'Create role') : count > 1 ? 'Create permissions' : 'Create permission')}
        </Button>
      </SheetFooter>
    </form>
  )
}
