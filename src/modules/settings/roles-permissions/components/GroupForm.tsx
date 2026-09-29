// src/modules/settings/roles-permissions/components/GroupForm.tsx
// Add or edit a permission group: name, description, Active, and its permissions.
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, Layers, Loader2, PlusCircle, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BasicInput, BasicTextarea } from '@/components/custom/FormInputs'
import { FieldGrid, FormSection, SheetFooter, SwitchField } from '@/components/custom/FormKit'
import { useTranslations } from '@/hooks/useTranslations'
import { useRefreshAuth } from '@/hooks/useRefreshAuth'
import { invalidatePermissionGroups } from '@/hooks/usePermissionGroups'
import { dispatchShowToast } from '@/lib/dispatch'
import type { IPermissionGroup } from '@/types/role-permission'
import { createPermissionGroup, updatePermissionGroup } from '../api'
import PermissionPicker from './PermissionPicker'

const schema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(150, 'Keep the name under 150 characters'),
  description: z.string().optional(),
  isActive: z.string(),
  permissions: z.array(z.string()),
})
type Values = z.infer<typeof schema>

const fromGroup = (g?: IPermissionGroup | null): Values => ({
  name: g?.name ?? '',
  description: g?.description ?? '',
  isActive: g && !g.isActive ? 'false' : 'true',
  permissions: g?.permissions ?? [],
})

interface Props {
  /** The group to edit; leave out to create one. */
  group?: IPermissionGroup | null
  onClose: () => void
  onSaved: () => void
}

export default function GroupForm({ group, onClose, onSaved }: Props) {
  const isEdit = !!group
  const { t } = useTranslations()
  const { refreshUser } = useRefreshAuth()
  const [saving, setSaving] = useState(false)
  const initial = fromGroup(group)

  const { register, handleSubmit, setValue, reset, control, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  })
  const { errors, isDirty } = formState
  const values = useWatch({ control }) as Values
  const setField = <K extends keyof Values>(key: K, value: Values[K]) => setValue(key, value as never, { shouldDirty: true })

  const onSubmit = async (data: Values) => {
    setSaving(true)
    try {
      const payload = { name: data.name.trim(), description: data.description?.trim() || undefined, isActive: data.isActive, permissions: data.permissions }
      if (group) await updatePermissionGroup(group.id, payload)
      else await createPermissionGroup(payload)
      invalidatePermissionGroups()
      // The signed-in user may hold this group; their permissions follow it.
      if (group) await refreshUser()
      dispatchShowToast({ type: 'success', message: t(isEdit ? 'Permission group updated' : 'Permission group created') })
      onSaved()
      onClose()
    } catch (error) {
      const e = error as { response?: { data?: { message?: string } } }
      dispatchShowToast({ type: 'danger', message: e.response?.data?.message || t('Failed to save the permission group') })
    } finally {
      setSaving(false)
    }
  }

  const reach = group ? [...group.roles, ...(group.userCount ? [`${group.userCount} ${t(group.userCount === 1 ? 'user' : 'users')}`] : [])] : []

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormSection icon={Layers} title={t('Group')} description={t('A named set of permissions you can give to roles and users.')}>
        <div className="space-y-4">
          <FieldGrid>
            <div className="md:col-span-2">
              <BasicInput id="name" label="Name" isRequired placeholder="e.g., Mail manager" register={register('name')} error={errors.name} model="PermissionGroup" />
            </div>
            <div className="md:col-span-2">
              <BasicTextarea id="description" label="Description" placeholder="What is this group for?" register={register('description')} error={errors.description} />
            </div>
          </FieldGrid>
          <SwitchField
            label={t('Active')}
            description={values.isActive === 'false' ? t('Gives nothing while off.') : t('Everyone who has the group gets its permissions.')}
            checked={values.isActive !== 'false'}
            onChange={(on) => setField('isActive', on ? 'true' : 'false')}
          />
          {reach.length > 0 && (
            <p className="rounded-lg border border-info/30 bg-info/10 p-3 text-xs text-foreground">
              {t('Changes apply right away to')}: <span className="font-medium">{reach.join(', ')}</span>
            </p>
          )}
        </div>
      </FormSection>

      <FormSection icon={KeyRound} title={t('Permissions')} description={t('Everything in the group.')}>
        <PermissionPicker id="permissions" label="Permissions in this group" value={values.permissions ?? []} onChange={(v) => setField('permissions', v)} />
      </FormSection>

      <SheetFooter
        status={
          isEdit ? (
            isDirty ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-warning" />
                {t('Unsaved changes')}
              </span>
            ) : (
              t('No changes yet')
            )
          ) : (
            `${values.permissions?.length ?? 0} ${t('permissions selected')}`
          )
        }
      >
        <Button type="button" variant="ghost" onClick={() => reset(initial)} disabled={saving || !isDirty}>
          <RotateCcw className="size-4" />
          {t('Reset')}
        </Button>
        <Button type="submit" disabled={saving || (isEdit && !isDirty)}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? <Save className="size-4" /> : <PlusCircle className="size-4" />}
          {saving ? `${t('Saving...')}` : isEdit ? t('Save changes') : t('Create group')}
        </Button>
      </SheetFooter>
    </form>
  )
}
